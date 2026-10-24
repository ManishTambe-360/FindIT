const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets/socketHandler');

/**
 * Save a notification and push it live to the user's open tabs.
 * Never throws: a failed notification must not break the main action.
 *
 * notify(userId, { type, title, body, link, item, conversation })
 */
const notify = async (userId, data) => {
  try {
    if (!userId) return null;
    const doc = await Notification.create({ user: userId, ...data });
    emitToUser(userId, 'notification:new', doc.toObject());
    return doc;
  } catch (err) {
    console.error('Notification failed:', err.message);
    return null;
  }
};

module.exports = { notify };
