const mongoose = require('mongoose');

// One thread per (item, pair of users). Usually: item poster <-> someone who saw the item.
const conversationSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // unread count per user id, e.g. { "<userId>": 3 }
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ item: 1, participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
