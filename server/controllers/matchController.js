const Item = require('../models/Item');
const Match = require('../models/Match');
const { findMatchesFor } = require('../utils/matchingAlgorithm');

const ITEM_FIELDS = 'type title category status images address date location postedBy';

const loadOwnedItem = async (req, res) => {
  const item = await Item.findById(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  const isOwner = item.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the poster can see matches for this item');
  }
  return item;
};

// Matches for a given item, shaped as { _id, score, ..., item: <the other item> }
const matchesForItem = async (item, userId) => {
  const ownKey = item.type === 'lost' ? 'lostItem' : 'foundItem';
  const otherKey = item.type === 'lost' ? 'foundItem' : 'lostItem';

  const matches = await Match.find({ [ownKey]: item._id, dismissedBy: { $ne: userId } })
    .sort({ score: -1 })
    .populate({ path: otherKey, select: ITEM_FIELDS, populate: { path: 'postedBy', select: 'name' } })
    .lean();

  return matches
    .filter((m) => m[otherKey] && m[otherKey].status === 'open')
    .map(({ lostItem, foundItem, dismissedBy, ...rest }) => ({
      ...rest,
      item: otherKey === 'lostItem' ? lostItem : foundItem,
    }));
};

// ---------- GET /api/matches/item/:itemId ----------
exports.getItemMatches = async (req, res, next) => {
  try {
    const item = await loadOwnedItem(req, res);
    res.json({ matches: await matchesForItem(item, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// ---------- POST /api/matches/item/:itemId/refresh ----------
exports.refreshItemMatches = async (req, res, next) => {
  try {
    const item = await loadOwnedItem(req, res);
    await findMatchesFor(item);
    res.json({ matches: await matchesForItem(item, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/matches/mine ----------
// Count of fresh suggestions per open item of mine (for dashboard badges)
exports.getMyMatchCounts = async (req, res, next) => {
  try {
    const mine = await Item.find({ postedBy: req.user._id, status: 'open' }).select('_id type').lean();
    const counts = {};
    await Promise.all(
      mine.map(async (it) => {
        counts[it._id] = (await matchesForItem(it, req.user._id)).length;
      })
    );
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    res.json({ counts, total });
  } catch (err) {
    next(err);
  }
};

// ---------- PATCH /api/matches/:id/dismiss ----------
exports.dismissMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('lostItem foundItem', 'postedBy');
    if (!match) {
      res.status(404);
      throw new Error('Match not found');
    }
    const uid = req.user._id.toString();
    const involved = [match.lostItem?.postedBy, match.foundItem?.postedBy].some((p) => p && p.toString() === uid);
    if (!involved) {
      res.status(403);
      throw new Error('Not allowed');
    }
    await Match.updateOne({ _id: match._id }, { $addToSet: { dismissedBy: req.user._id } });
    res.json({ message: 'Suggestion hidden' });
  } catch (err) {
    next(err);
  }
};
