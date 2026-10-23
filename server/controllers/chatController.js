const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Item = require('../models/Item');
const { emitToUser, isOnline } = require('../sockets/socketHandler');

const PAGE_SIZE = 30;

const loadConversationFor = async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  if (!convo.participants.some((p) => p.equals(req.user._id))) {
    res.status(403);
    throw new Error('You are not part of this conversation');
  }
  return convo;
};

// Shape a conversation for the current user: who is the other person, my unread count
const present = (convo, me) => {
  const obj = convo.toObject ? convo.toObject() : convo;
  const other = obj.participants.find((p) => (p._id || p).toString() !== me.toString());
  const unread = obj.unread instanceof Map ? obj.unread.get(me.toString()) : obj.unread?.[me.toString()];
  return {
    _id: obj._id,
    item: obj.item,
    otherUser: other ? { ...other, online: isOnline(other._id || other) } : null,
    lastMessage: obj.lastMessage,
    lastMessageAt: obj.lastMessageAt,
    lastSender: obj.lastSender,
    unread: unread || 0,
  };
};

const populateConvo = (q) =>
  q.populate('participants', 'name').populate('item', 'title type status images postedBy');

// ---------- POST /api/chats/item/:itemId ----------
// Open (or reuse) a chat with the poster of an item.
// The poster can pass { userId } to start a chat with a specific person (e.g. a claimant or match).
exports.startConversation = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).select('postedBy title');
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    const me = req.user._id;
    const isPoster = item.postedBy.equals(me);
    const otherId = isPoster ? req.body.userId : item.postedBy;

    if (!otherId) {
      res.status(400);
      throw new Error('This is your own item. Choose who you want to message.');
    }
    if (otherId.toString() === me.toString()) {
      res.status(400);
      throw new Error("You can't message yourself");
    }

    let convo = await Conversation.findOne({ item: item._id, participants: { $all: [me, otherId] } });
    if (!convo) convo = await Conversation.create({ item: item._id, participants: [me, otherId] });

    convo = await populateConvo(Conversation.findById(convo._id));
    res.status(201).json({ conversation: present(convo, me) });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/chats ----------
exports.getConversations = async (req, res, next) => {
  try {
    const convos = await populateConvo(
      Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 })
    );
    res.json({ conversations: convos.map((c) => present(c, req.user._id)) });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/chats/unread-count ----------
exports.getUnreadCount = async (req, res, next) => {
  try {
    const key = `unread.${req.user._id}`;
    const convos = await Conversation.find({ participants: req.user._id, [key]: { $gt: 0 } })
      .select('unread')
      .lean();
    const count = convos.reduce((s, c) => s + (c.unread?.[req.user._id.toString()] || 0), 0);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// ---------- GET /api/chats/:id/messages?before=<ISO date> ----------
// Newest page first; pass `before` to load older messages. Also marks the thread as read.
exports.getMessages = async (req, res, next) => {
  try {
    const convo = await loadConversationFor(req, res);
    const filter = { conversation: convo._id };
    if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

    const page = await Message.find(filter).sort({ createdAt: -1 }).limit(PAGE_SIZE + 1).lean();
    const hasMore = page.length > PAGE_SIZE;
    const messages = page.slice(0, PAGE_SIZE).reverse();

    await markRead(convo, req.user._id);

    const populated = await populateConvo(Conversation.findById(convo._id));
    res.json({ conversation: present(populated, req.user._id), messages, hasMore });
  } catch (err) {
    next(err);
  }
};

const markRead = async (convo, userId) => {
  const uid = userId.toString();
  if (!(convo.unread?.get(uid) > 0)) return;
  const now = new Date();
  await Message.updateMany(
    { conversation: convo._id, sender: { $ne: userId }, readAt: null },
    { readAt: now }
  );
  await Conversation.updateOne({ _id: convo._id }, { $set: { [`unread.${uid}`]: 0 } });
  convo.participants
    .filter((p) => p.toString() !== uid)
    .forEach((p) => emitToUser(p, 'chat:read', { conversationId: convo._id, readAt: now }));
};

// ---------- PATCH /api/chats/:id/read ----------
exports.markConversationRead = async (req, res, next) => {
  try {
    const convo = await loadConversationFor(req, res);
    await markRead(convo, req.user._id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ---------- POST /api/chats/:id/messages ----------
exports.sendMessage = async (req, res, next) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) {
      res.status(400);
      throw new Error('Message cannot be empty');
    }
    const convo = await loadConversationFor(req, res);
    const me = req.user._id.toString();

    const message = await Message.create({ conversation: convo._id, sender: req.user._id, text });

    const inc = {};
    convo.participants
      .filter((p) => p.toString() !== me)
      .forEach((p) => { inc[`unread.${p}`] = 1; });

    await Conversation.updateOne(
      { _id: convo._id },
      { $set: { lastMessage: text.slice(0, 120), lastMessageAt: message.createdAt, lastSender: req.user._id }, $inc: inc }
    );

    // Push to everyone in the thread (including my other tabs)
    const payload = { conversationId: convo._id.toString(), message: message.toObject() };
    convo.participants.forEach((p) => emitToUser(p, 'chat:message', payload));

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};
