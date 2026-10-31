const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

const userRoom = (id) => `user:${id}`;
const online = new Map(); // userId -> number of open sockets (tabs)

let io = null;

// Send an event to every open tab of a user
const emitToUser = (userId, event, payload) => {
  if (io) io.to(userRoom(userId.toString())).emit(event, payload);
};

const isOnline = (userId) => online.has(userId.toString());

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Authenticate every socket with the same JWT used by the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(id).select('name isBlocked');
      if (!user || user.isBlocked) return next(new Error('Not allowed'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.user._id.toString();
    socket.join(userRoom(uid));
    online.set(uid, (online.get(uid) || 0) + 1);

    // "is typing..." indicator, relayed only to the other participant
    socket.on('chat:typing', async ({ conversationId, typing }) => {
      try {
        const convo = await Conversation.findById(conversationId).select('participants').lean();
        if (!convo || !convo.participants.some((p) => p.toString() === uid)) return;
        convo.participants
          .filter((p) => p.toString() !== uid)
          .forEach((p) => emitToUser(p, 'chat:typing', { conversationId, userId: uid, typing: Boolean(typing) }));
      } catch (e) {
        // ignore bad ids
      }
    });

    socket.on('disconnect', () => {
      const n = (online.get(uid) || 1) - 1;
      if (n <= 0) online.delete(uid);
      else online.set(uid, n);
    });
  });

  return io;
};

// Force-close every socket of a user (used when an admin blocks/deletes them)
const disconnectUser = (userId) => {
  if (io) io.in(userRoom(userId.toString())).disconnectSockets(true);
};

module.exports = { initSocket, emitToUser, isOnline, disconnectUser };
