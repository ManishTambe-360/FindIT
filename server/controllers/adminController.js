const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { deleteImages } = require('../config/cloudinary');
const { disconnectUser } = require('../sockets/socketHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const paging = (q, def = 15) => {
  const page = Math.max(parseInt(q.page) || 1, 1);
  const limit = Math.min(parseInt(q.limit) || def, 50);
  return { page, limit, skip: (page - 1) * limit };
};
const countBy = (rows) => rows.reduce((o, r) => ({ ...o, [r._id]: r.count }), {});

// ---------- GET /api/admin/stats ----------
exports.getStats = async (req, res, next) => {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13); // last 14 days incl. today

    const [
      users, blocked, admins, newUsers7d,
      byType, byStatus, byCategory, claimsByStatus,
      matches, conversations, messages, daily, topUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Item.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Item.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Item.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Claim.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Match.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Item.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, type: '$type' },
            count: { $sum: 1 },
          },
        },
      ]),
      User.find({ reputationPoints: { $gt: 0 } }).sort({ reputationPoints: -1 }).limit(5).select('name reputationPoints'),
    ]);

    // fill every day of the window so the chart has no gaps
    const days = [];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const find = (t) => daily.find((r) => r._id.day === key && r._id.type === t)?.count || 0;
      days.push({ day: key, lost: find('lost'), found: find('found') });
    }

    const types = countBy(byType);
    const statuses = countBy(byStatus);
    const totalItems = (types.lost || 0) + (types.found || 0);

    res.json({
      users: { total: users, blocked, admins, new7d: newUsers7d },
      items: {
        total: totalItems,
        lost: types.lost || 0,
        found: types.found || 0,
        open: statuses.open || 0,
        claimed: statuses.claimed || 0,
        returned: statuses.returned || 0,
        // share of items that made it back to their owner
        recoveryRate: totalItems ? Math.round(((statuses.returned || 0) / totalItems) * 100) : 0,
      },
      claims: { pending: 0, approved: 0, rejected: 0, withdrawn: 0, ...countBy(claimsByStatus) },
      categories: byCategory.map((c) => ({ category: c._id, count: c.count })),
      matches,
      chats: { conversations, messages },
      daily: days,
      topUsers,
    });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/admin/users?search=&role=&status=active|blocked&page= ----------
exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);
    const filter = {};
    if (req.query.search?.trim()) {
      const rx = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.status === 'blocked') filter.isBlocked = true;
    if (req.query.status === 'active') filter.isBlocked = false;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    // how many items each listed user has posted
    const counts = await Item.aggregate([
      { $match: { postedBy: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$postedBy', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    users.forEach((u) => { u.itemCount = map[u._id.toString()] || 0; });

    res.json({ users, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    next(err);
  }
};

const loadTargetUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't do this to your own account");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  return user;
};

// ---------- PATCH /api/admin/users/:id/block  { blocked: true|false } ----------
exports.setBlocked = async (req, res, next) => {
  try {
    const user = await loadTargetUser(req, res);
    user.isBlocked = Boolean(req.body.blocked);
    await user.save();
    if (user.isBlocked) disconnectUser(user._id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ---------- PATCH /api/admin/users/:id/role  { role: 'user'|'admin' } ----------
exports.setRole = async (req, res, next) => {
  try {
    if (!['user', 'admin'].includes(req.body.role)) {
      res.status(400);
      throw new Error('Role must be "user" or "admin"');
    }
    const user = await loadTargetUser(req, res);
    user.role = req.body.role;
    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ---------- DELETE /api/admin/users/:id ----------
// Removes the account and everything that belongs to it.
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await loadTargetUser(req, res);

    const items = await Item.find({ postedBy: user._id }).select('images');
    const itemIds = items.map((i) => i._id);
    await deleteImages(items.flatMap((i) => i.images.map((img) => img.publicId)));

    const convos = await Conversation.find({ participants: user._id }).select('_id');
    const convoIds = convos.map((c) => c._id);

    await Promise.all([
      Item.deleteMany({ _id: { $in: itemIds } }),
      Claim.deleteMany({ $or: [{ claimant: user._id }, { item: { $in: itemIds } }] }),
      Match.deleteMany({ $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }] }),
      Message.deleteMany({ conversation: { $in: convoIds } }),
      Conversation.deleteMany({ _id: { $in: convoIds } }),
      Notification.deleteMany({ $or: [{ user: user._id }, { item: { $in: itemIds } }] }),
    ]);
    await user.deleteOne();
    disconnectUser(user._id);

    res.json({ message: `Deleted ${user.name} and ${itemIds.length} item(s)` });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/admin/items?search=&type=&status=&category=&page= ----------
// (delete / status changes reuse the normal item endpoints, which already allow admins)
exports.getItems = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);
    const { search, type, status, category } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('type title category status images address date createdAt postedBy')
        .populate('postedBy', 'name email isBlocked')
        .lean(),
      Item.countDocuments(filter),
    ]);

    const claimCounts = await Claim.aggregate([
      { $match: { item: { $in: items.map((i) => i._id) } } },
      { $group: { _id: '$item', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(claimCounts.map((c) => [c._id.toString(), c.count]));
    items.forEach((i) => { i.claimCount = map[i._id.toString()] || 0; });

    res.json({ items, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    next(err);
  }
};
