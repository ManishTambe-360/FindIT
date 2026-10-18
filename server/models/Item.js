const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Wallet & Cards',
  'Keys',
  'Documents & ID',
  'Bags',
  'Clothing',
  'Jewellery & Accessories',
  'Books & Stationery',
  'Pets',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: [true, 'Type is required'] },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    category: { type: String, enum: CATEGORIES, required: [true, 'Category is required'] },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    images: [{ _id: false, url: String, publicId: String }],

    // GeoJSON point: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, trim: true, default: '' },
    date: { type: Date, required: [true, 'Date is required'] },

    status: { type: String, enum: ['open', 'claimed', 'returned'], default: 'open' },

    // Used in Phase 4 (claim verification). Answer is hidden by default.
    verificationQuestion: { type: String, trim: true, default: '' },
    verificationAnswer: { type: String, select: false, default: '' },

    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

itemSchema.index({ location: '2dsphere' });
itemSchema.index({ type: 1, status: 1, category: 1, createdAt: -1 });

const Item = mongoose.model('Item', itemSchema);
Item.CATEGORIES = CATEGORIES;

module.exports = Item;