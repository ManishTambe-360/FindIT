const mongoose = require('mongoose');

const TYPES = [
  'match', // a possible match was found for your item
  'claim_new', // someone claimed your item
  'claim_approved', // your claim was approved
  'claim_rejected', // your claim was rejected
  'claim_withdrawn', // a claimant withdrew their claim on your item
  'message', // new chat message while you were offline
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: '', maxlength: 300 },
    link: { type: String, default: '' }, // client route to open, e.g. /items/:id
    read: { type: Boolean, default: false },

    // optional references, used to avoid duplicate notifications
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
// Old notifications clean themselves up after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

const Notification = mongoose.model('Notification', notificationSchema);
Notification.TYPES = TYPES;

module.exports = Notification;
