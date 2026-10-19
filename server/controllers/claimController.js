const Claim = require('../models/Claim');
const Item = require('../models/Item');

const MAX_ATTEMPTS = 3;

const normalize = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const publicUser = (u) => (u ? { _id: u._id, name: u.name } : null);
const contactUser = (u) => (u ? { _id: u._id, name: u.name, email: u.email, phone: u.phone } : null);

// ---------- POST /api/claims/item/:itemId ----------
exports.createClaim = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).select('+verificationAnswer');
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
    if (item.postedBy.equals(req.user._id)) {
      res.status(400);
      throw new Error('You cannot claim your own item');
    }
    if (item.status !== 'open') {
      res.status(400);
      throw new Error('This item is no longer open for claims');
    }

    const message = (req.body.message || '').trim();
    if (!message) {
      res.status(400);
      throw new Error('Please write a message for the poster');
    }

    const previous = await Claim.find({ item: item._id, claimant: req.user._id });
    if (previous.some((c) => ['pending', 'approved'].includes(c.status))) {
      res.status(400);
      throw new Error('You already have an active claim on this item');
    }
    if (previous.length >= MAX_ATTEMPTS) {
      res.status(400);
      throw new Error('You have used all your claim attempts for this item');
    }

    let answer = '';
    let answerMatches = null;
    if (item.verificationQuestion) {
      answer = (req.body.answer || '').trim();
      if (!answer) {
        res.status(400);
        throw new Error('Please answer the verification question');
      }
      answerMatches = normalize(answer) === normalize(item.verificationAnswer);
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      itemOwner: item.postedBy,
      message,
      answer,
      answerMatches,
    });

    // The claimant is deliberately NOT told whether the answer matched
    res.status(201).json({ claim: { _id: claim._id, status: claim.status, createdAt: claim.createdAt } });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/claims/mine ---------- (claims I made)
exports.getMyClaims = async (req, res, next) => {
  try {
    const docs = await Claim.find({ claimant: req.user._id })
      .sort({ createdAt: -1 })
      .populate('item', 'title type images status')
      .populate('itemOwner', 'name email phone');

    const claims = docs
      .filter((c) => c.item) // skip claims whose item was removed
      .map((c) => {
        const o = c.toObject();
        delete o.answerMatches; // never reveal to claimant
        o.itemOwner = c.status === 'approved' ? contactUser(c.itemOwner) : publicUser(c.itemOwner);
        return o;
      });

    res.json({ claims });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/claims/received ---------- (claims on my items)
exports.getReceivedClaims = async (req, res, next) => {
  try {
    const docs = await Claim.find({ itemOwner: req.user._id })
      .sort({ createdAt: -1 })
      .populate('item', 'title type images status verificationQuestion')
      .populate('claimant', 'name email phone');

    const order = { pending: 0, approved: 1, rejected: 2, withdrawn: 3 };
    const claims = docs
      .filter((c) => c.item)
      .map((c) => {
        const o = c.toObject();
        o.claimant = c.status === 'approved' ? contactUser(c.claimant) : publicUser(c.claimant);
        return o;
      })
      .sort((a, b) => order[a.status] - order[b.status]); // pending first (stable, keeps newest first)

    res.json({ claims });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/claims/pending-count ----------
exports.getPendingCount = async (req, res, next) => {
  try {
    const count = await Claim.countDocuments({ itemOwner: req.user._id, status: 'pending' });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// ---------- PATCH /api/claims/:id/status ----------
// Owner/admin: 'approved' | 'rejected'.  Claimant: 'withdrawn'.
exports.updateClaimStatus = async (req, res, next) => {
  try {
    const { status, ownerNote } = req.body;
    if (!['approved', 'rejected', 'withdrawn'].includes(status)) {
      res.status(400);
      throw new Error('Status must be approved, rejected or withdrawn');
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      res.status(404);
      throw new Error('Claim not found');
    }
    if (claim.status !== 'pending') {
      res.status(400);
      throw new Error(`This claim is already ${claim.status}`);
    }

    const isOwner = claim.itemOwner.equals(req.user._id) || req.user.role === 'admin';
    const isClaimant = claim.claimant.equals(req.user._id);

    if (status === 'withdrawn') {
      if (!isClaimant) {
        res.status(403);
        throw new Error('Only the claimant can withdraw a claim');
      }
      claim.status = 'withdrawn';
      await claim.save();
      return res.json({ claim });
    }

    if (!isOwner) {
      res.status(403);
      throw new Error('Only the item poster can approve or reject claims');
    }

    if (status === 'rejected') {
      claim.status = 'rejected';
      claim.ownerNote = (ownerNote || '').trim().slice(0, 300);
      await claim.save();
      return res.json({ claim });
    }

    // ----- approve -----
    const item = await Item.findById(claim.item);
    if (!item || item.status !== 'open') {
      res.status(400);
      throw new Error('This item is not open any more');
    }

    claim.status = 'approved';
    await claim.save();

    item.status = 'claimed';
    await item.save();

    // Everyone else waiting on this item is auto-rejected
    await Claim.updateMany(
      { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
      { status: 'rejected', ownerNote: 'Another claim was approved for this item' }
    );

    res.json({ claim });
  } catch (err) {
    next(err);
  }
};