require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');

const CENTER = { lat: 19.076, lng: 72.8777 }; // change to your college location
const COUNT = 40;

const SAMPLES = [
  ['Black wallet', 'Wallet & Cards'],
  ['iPhone 13', 'Electronics'],
  ['Hostel room keys', 'Keys'],
  ['College ID card', 'Documents & ID'],
  ['Blue backpack', 'Bags'],
  ['Grey hoodie', 'Clothing'],
  ['Silver ring', 'Jewellery & Accessories'],
  ['Physics notebook', 'Books & Stationery'],
  ['AirPods case', 'Electronics'],
  ['Steel water bottle', 'Other'],
];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // npm run seed:items -- --clear
    if (process.argv.includes('--clear')) {
      const r = await Item.deleteMany({ address: /\[demo\]$/ });
      console.log(`Removed ${r.deletedCount} demo items`);
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('No admin found. Run: npm run seed:admin');

    const docs = Array.from({ length: COUNT }, () => {
      const [title, category] = pick(SAMPLES);
      const type = Math.random() < 0.5 ? 'lost' : 'found';
      const daysAgo = Math.floor(rand(0, 20));
      return {
        type,
        title,
        category,
        description: `${type === 'lost' ? 'Lost' : 'Found'} ${title.toLowerCase()} somewhere in this area.`,
        date: new Date(Date.now() - daysAgo * 86400000),
        address: 'Near campus [demo]',
        status: Math.random() < 0.85 ? 'open' : 'returned',
        location: {
          type: 'Point',
          // roughly +/- 3 km around the centre. GeoJSON = [lng, lat]
          coordinates: [CENTER.lng + rand(-0.03, 0.03), CENTER.lat + rand(-0.03, 0.03)],
        },
        postedBy: admin._id,
      };
    });

    await Item.insertMany(docs);
    console.log(`Created ${COUNT} demo items`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
})();