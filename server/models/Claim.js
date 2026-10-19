const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // denormalised for fast "received" queries

    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 500 },
    answer: { type: String, trim: true, default: '' },
    // true / false when the item has a verification question, null when it doesn't
    answerMatches: { type: Boolean, default: null },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    ownerNote: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

claimSchema.index({ item: 1, claimant: 1 });
claimSchema.index({ itemOwner: 1, status: 1, createdAt: -1 });
claimSchema.index({ claimant: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);