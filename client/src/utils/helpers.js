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