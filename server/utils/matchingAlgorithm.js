const Item = require('../models/Item');
const Match = require('../models/Match');
const { notify } = require('./notify');

// ---------- tuning ----------
const MAX_DISTANCE_KM = 10; // candidates further than this are ignored
const MAX_DAYS_APART = 60; // ...and so are reports this far apart in time
const MIN_SCORE = 35; // below this a pairing is not saved
const WEIGHTS = { text: 0.5, distance: 0.3, date: 0.2 };

const STOPWORDS = new Set(
  ('a an the and or but of in on at to for with from by is was were are be been it its this that these those ' +
    'my your his her their our i me we you he she they lost found near around some any have has had ' +
    'very please item thing color colour one two').split(' ')
);

// Very light stemmer: "wallets" -> "wallet", "keys" -> "key", "charging" -> "charg"
const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '');

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);

// Title words count double because titles are short and specific
const keywords = (item) => [...tokenize(item.title), ...tokenize(item.title), ...tokenize(item.description)];

// Cosine similarity between two bags of words (0..1)
const textSimilarity = (a, b) => {
  const count = (arr) => arr.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());
  const ca = count(a);
  const cb = count(b);
  let dot = 0;
  ca.forEach((v, w) => { if (cb.has(w)) dot += v * cb.get(w); });
  const norm = (m) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  const denom = norm(ca) * norm(cb);
  return denom ? dot / denom : 0;
};

const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

// Score one lost/found pair. Returns null if they can't be the same object.
const scorePair = (lost, found) => {
  if (lost.category !== found.category) return null;

  // Something can't be found more than a day before it was lost
  const daysApart = (new Date(found.date) - new Date(lost.date)) / 86400000;
  if (daysApart < -1 || daysApart > MAX_DAYS_APART) return null;

  const km = haversineKm(lost.location.coordinates, found.location.coordinates);
  if (km > MAX_DISTANCE_KM) return null;

  const lw = keywords(lost);
  const fw = keywords(found);
  const text = textSimilarity(lw, fw);
  const distance = 1 - km / MAX_DISTANCE_KM;
  const date = 1 - Math.max(daysApart, 0) / MAX_DAYS_APART;

  const score = Math.round(100 * (WEIGHTS.text * text + WEIGHTS.distance * distance + WEIGHTS.date * date));
  const fwSet = new Set(fw);
  const commonWords = [...new Set(tokenize(`${lost.title} ${lost.description}`))]
    .filter((w) => fwSet.has(w))
    .slice(0, 8);

  return {
    score,
    breakdown: { text: Math.round(text * 100), distance: Math.round(distance * 100), date: Math.round(date * 100) },
    distanceKm: Math.round(km * 100) / 100,
    commonWords,
  };
};

/**
 * Recompute suggestions for one item against all open items of the opposite type.
 * Safe to call after create/update. Returns the number of matches saved.
 */
const findMatchesFor = async (itemOrId) => {
  const item = typeof itemOrId === 'object' && itemOrId.location ? itemOrId : await Item.findById(itemOrId);
  if (!item) return 0;

  const isLost = item.type === 'lost';
  const ownKey = isLost ? 'lostItem' : 'foundItem';

  if (item.status !== 'open') return 0;

  const candidates = await Item.find({
    _id: { $ne: item._id },
    type: isLost ? 'found' : 'lost',
    status: 'open',
    category: item.category,
    postedBy: { $ne: item.postedBy }, // never match someone with themselves
    location: {
      $geoWithin: { $centerSphere: [item.location.coordinates, MAX_DISTANCE_KM / 6378.1] },
    },
  }).lean();

  const keepIds = [];
  const ops = [];
  candidates.forEach((c) => {
    const lost = isLost ? item : c;
    const found = isLost ? c : item;
    const result = scorePair(lost, found);
    if (!result || result.score < MIN_SCORE) return;
    keepIds.push(c._id);
    ops.push({
      updateOne: {
        filter: { lostItem: lost._id, foundItem: found._id },
        update: { $set: result },
        upsert: true,
      },
    });
  });

  // Drop old suggestions that no longer qualify (e.g. after an edit)
  const otherKey = isLost ? 'foundItem' : 'lostItem';
  const existing = await Match.find({ [ownKey]: item._id }).select(otherKey).lean();
  const known = new Set(existing.map((m) => m[otherKey].toString()));

  await Match.deleteMany({ [ownKey]: item._id, [otherKey]: { $nin: keepIds } });
  if (ops.length) await Match.bulkWrite(ops);

  // Tell both posters about matches we haven't seen before
  candidates
    .filter((c) => keepIds.some((id) => id.equals(c._id)) && !known.has(c._id.toString()))
    .forEach((c) => {
      notify(item.postedBy, {
        type: 'match',
        title: `Possible match for "${item.title}"`,
        body: `A ${c.type} report "${c.title}" looks similar.`,
        link: `/items/${item._id}`,
        item: item._id,
      });
      notify(c.postedBy, {
        type: 'match',
        title: `Possible match for "${c.title}"`,
        body: `A new ${item.type} report "${item.title}" looks similar.`,
        link: `/items/${c._id}`,
        item: c._id,
      });
    });

  return ops.length;
};

// Fire-and-forget wrapper so matching never breaks the main request
const runMatchingInBackground = (item) => {
  findMatchesFor(item).catch((err) => console.error('Matching failed:', err.message));
};

module.exports = { findMatchesFor, runMatchingInBackground, scorePair, tokenize };
