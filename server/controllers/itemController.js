const Item = require('../models/Item');
const { uploadBuffer, deleteImages } = require('../config/cloudinary');

const MAX_IMAGES = 4;

// ---------- helpers ----------
const parseLocation = (body) => {
  const lat = parseFloat(body.lat);
  const lng = parseFloat(body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { type: 'Point', coordinates: [lng, lat] }; // GeoJSON = [lng, lat]
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isOwnerOrAdmin = (item, user) =>
  item.postedBy.toString() === user._id.toString() || user.role === 'admin';

const validateDate = (res, value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    res.status(400);
    throw new Error('Please provide a valid date');
  }
  if (d > new Date()) {
    res.status(400);
    throw new Error('Date cannot be in the future');
  }
  return d;
};

// ---------- POST /api/items ----------
exports.createItem = async (req, res, next) => {
  let uploaded = [];
  try {
    const { type, title, category, description, date, address, verificationQuestion, verificationAnswer } = req.body;

    const location = parseLocation(req.body);
    if (!location) {
      res.status(400);
      throw new Error('Please pick the location on the map');
    }
    const parsedDate = validateDate(res, date);

    // verification question only makes sense for found items
    const hasQuestion = Boolean(type === 'found' && verificationQuestion && verificationQuestion.trim());
    if (hasQuestion && !(verificationAnswer && verificationAnswer.trim())) {
      res.status(400);
      throw new Error('Please provide the answer to your verification question');
    }

    uploaded = await Promise.all((req.files || []).map((f) => uploadBuffer(f.buffer)));

    const item = await Item.create({
      type,
      title,
      category,
      description,
      date: parsedDate,
      address,
      location,
      images: uploaded,
      verificationQuestion: hasQuestion ? verificationQuestion.trim() : '',
      verificationAnswer: hasQuestion ? verificationAnswer.trim().toLowerCase() : '',
      postedBy: req.user._id,
    });

    res.status(201).json({ item });
  } catch (err) {
    if (uploaded.length) await deleteImages(uploaded.map((i) => i.publicId));
    next(err);
  }
};

// ---------- GET /api/items ----------
// Query: type, category, status, search, from, to, lat, lng, radius(km), page, limit
exports.getItems = async (req, res, next) => {
  try {
    const { type, category, status, search, from, to, lat, lng, radius } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
    }

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // "Near me": items within `radius` km of (lat, lng)
    if (lat && lng) {
      const km = parseFloat(radius) || 5;
      filter.location = {
        $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], km / 6378.1] },
      };
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('postedBy', 'name'),
      Item.countDocuments(filter),
    ]);

    res.json({ items, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/items/mine ----------
exports.getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/items/:id ----------
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'name reputationPoints createdAt');
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    const obj = item.toObject();
    const canSeeQuestion =
      req.user && (req.user.role === 'admin' || (item.postedBy && item.postedBy._id.equals(req.user._id)));

    obj.hasVerificationQuestion = Boolean(item.verificationQuestion);
    if (!canSeeQuestion) delete obj.verificationQuestion; // claimants get it in Phase 4

    res.json({ item: obj });
  } catch (err) {
    next(err);
  }
};

// ---------- PUT /api/items/:id ----------
exports.updateItem = async (req, res, next) => {
  let uploaded = [];
  try {
    const item = await Item.findById(req.params.id).select('+verificationAnswer');
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
    if (!isOwnerOrAdmin(item, req.user)) {
      res.status(403);
      throw new Error('You can only edit your own items');
    }

    ['title', 'category', 'description', 'address'].forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    if (req.body.date) item.date = validateDate(res, req.body.date);

    if (req.body.lat !== undefined && req.body.lng !== undefined) {
      const location = parseLocation(req.body);
      if (!location) {
        res.status(400);
        throw new Error('Invalid location');
      }
      item.location = location;
    }

    // ----- images -----
    let removeIds = [];
    try {
      removeIds = JSON.parse(req.body.removeImages || '[]');
    } catch (e) {
      removeIds = [];
    }
    const remaining = item.images.filter((img) => !removeIds.includes(img.publicId));
    const removed = item.images.filter((img) => removeIds.includes(img.publicId));
    const newFiles = req.files || [];

    if (remaining.length + newFiles.length > MAX_IMAGES) {
      res.status(400);
      throw new Error(`An item can have at most ${MAX_IMAGES} images`);
    }
    uploaded = await Promise.all(newFiles.map((f) => uploadBuffer(f.buffer)));
    item.images = [...remaining, ...uploaded];

    // ----- verification question (found items only) -----
    if (item.type === 'found' && req.body.verificationQuestion !== undefined) {
      const q = req.body.verificationQuestion.trim();
      if (!q) {
        item.verificationQuestion = '';
        item.verificationAnswer = '';
      } else {
        const a = (req.body.verificationAnswer || '').trim().toLowerCase();
        if (a) item.verificationAnswer = a; // blank answer = keep the old one
        if (!item.verificationAnswer) {
          res.status(400);
          throw new Error('Please provide the answer to your verification question');
        }
        item.verificationQuestion = q;
      }
    }

    await item.save();
    await deleteImages(removed.map((i) => i.publicId));

    res.json({ item });
  } catch (err) {
    if (uploaded.length) await deleteImages(uploaded.map((i) => i.publicId));
    next(err);
  }
};

// ---------- PATCH /api/items/:id/status ----------
// Owner can reopen or mark as returned. ("claimed" is set by the claim flow in Phase 4)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'returned'].includes(status)) {
      res.status(400);
      throw new Error('Status must be "open" or "returned"');
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
    if (!isOwnerOrAdmin(item, req.user)) {
      res.status(403);
      throw new Error('Not allowed');
    }

    item.status = status;
    await item.save();
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// ---------- DELETE /api/items/:id ----------
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
    if (!isOwnerOrAdmin(item, req.user)) {
      res.status(403);
      throw new Error('You can only delete your own items');
    }

    await deleteImages(item.images.map((i) => i.publicId));
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};