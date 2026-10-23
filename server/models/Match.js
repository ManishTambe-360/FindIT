const mongoose = require('mongoose');

// A suggested pairing between a LOST item and a FOUND item
const matchSchema = new mongoose.Schema(
  {
    lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    foundItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },

    score: { type: Number, required: true, min: 0, max: 100 }, // overall %
    breakdown: {
      _id: false,
      text: Number, // 0-100
      distance: Number, // 0-100
      date: Number, // 0-100
    },
    distanceKm: Number,
    commonWords: [String],

    // Each side can hide a suggestion independently
    dismissedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchSchema.index({ foundItem: 1 });

module.exports = mongoose.model('Match', matchSchema);
