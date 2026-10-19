import toast from 'react-hot-toast';
import { CATEGORIES } from '../../utils/helpers';

export default function ItemFilters({ filters, onChange, onReset }) {
  const set = (name, value) => onChange({ ...filters, [name]: value });

  const toggleNear = (checked) => {
    if (!checked) {
      return onChange({
        ...filters,
        near: false,
        lat: '',
        lng: '',
        sort: filters.sort === 'nearest' ? 'newest' : filters.sort,
      });
    }
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        onChange({
          ...filters,
          near: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          sort: 'nearest',
        }),
      () => toast.error('Could not get your location')
    );
  };

  const nearReady = filters.near && filters.lat !== '';
  const field = 'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-indigo-500';

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <input
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        placeholder="Search by title, description or place..."
        className={field}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={field}>
          <option value="">Lost & Found</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>

        <select value={filters.category} onChange={(e) => set('category', e.target.value)} className={field}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={field}>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="returned">Returned</option>
          <option value="">Any status</option>
        </select>

        <select value={filters.sort} onChange={(e) => set('sort', e.target.value)} className={field}>
          <option value="newest">Sort: Newest posted</option>
          <option value="oldest">Sort: Oldest posted</option>
          <option value="date_desc">Sort: Latest lost/found date</option>
          <option value="nearest" disabled={!nearReady}>Sort: Nearest first</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="text-xs text-slate-500">
          From date
          <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={field} />
        </label>
        <label className="text-xs text-slate-500">
          To date
          <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={field} />
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm md:col-span-1">
          <input type="checkbox" checked={filters.near} onChange={(e) => toggleNear(e.target.checked)} />
          Near me within
          <select
            value={filters.radius}
            onChange={(e) => set('radius', e.target.value)}
            disabled={!filters.near}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            {[1, 2, 5, 10, 25].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>

        <div className="flex items-end">
          <button onClick={onReset} className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}