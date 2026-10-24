const Notification = require('../models/Notification');

// ---------- GET /api/notifications?page=1&unread=true ----------
exports.getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const filter = { user: req.user._id };
    if (req.query.unread === 'true') filter.read = false;

    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ notifications, page, pages: Math.ceil(total / limit) || 1, total, unread });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/notifications/unread-count ----------
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// ---------- PATCH /api/notifications/read-all ----------
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ---------- PATCH /api/notifications/:id/read ----------
exports.markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json({ notification: n });
  } catch (err) {
    next(err);
  }
};

// ---------- DELETE /api/notifications/:id ----------
exports.deleteNotification = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!n) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// ---------- DELETE /api/notifications ---------- (clear read ones)
exports.clearRead = async (req, res, next) => {
  try {
    const { deletedCount } = await Notification.deleteMany({ user: req.user._id, read: true });
    res.json({ deleted: deletedCount });
  } catch (err) {
    next(err);
  }
};
