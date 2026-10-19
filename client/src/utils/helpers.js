export const CATEGORIES = [
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

export const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  claimed: 'bg-amber-100 text-amber-700',
  returned: 'bg-slate-200 text-slate-600',
};

export const TYPE_STYLES = {
  lost: 'bg-red-100 text-red-700',
  found: 'bg-emerald-100 text-emerald-700',
};

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// today's date in local time as YYYY-MM-DD (for <input type="date" max=...>)
export const todayISO = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
export const DEFAULT_CENTER = [19.076, 72.8777]; // change to your college location

// Distance in km between two lat/lng points (haversine formula)
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

export const formatDistance = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;