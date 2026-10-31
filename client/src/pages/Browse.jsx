import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ItemCard from '../components/items/ItemCard';
import ItemFilters from '../components/items/ItemFilters';
import Loader from '../components/common/Loader';
import { getItems } from '../services/itemService';
import { haversineKm } from '../utils/helpers';

const initialFilters = {
  search: '', type: '', category: '', status: 'open',
  from: '', to: '', near: false, lat: '', lng: '', radius: 5, sort: 'newest',
};

export default function Browse() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // small debounce so typing in search doesn't fire a request per keystroke
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { page, limit: 9, sort: filters.sort };
        ['search', 'type', 'category', 'status', 'from', 'to'].forEach((k) => {
          if (filters[k]) params[k] = filters[k];
        });
        if (filters.near && filters.lat !== '') {
          params.lat = filters.lat;
          params.lng = filters.lng;
          params.radius = filters.radius;
        }
        const res = await getItems(params);
        setData(res.data);
      } catch {
        toast.error('Could not load items');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, page]);

  const handleFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  const distanceFor = (item) => {
    if (!filters.near || filters.lat === '') return null;
    const [lng, lat] = item.location.coordinates;
    return haversineKm(Number(filters.lat), Number(filters.lng), lat, lng);
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Browse items</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/map" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white">
            View on map
          </Link>
          <Link to="/report?type=lost" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            I lost something
          </Link>
          <Link to="/report?type=found" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            I found something
          </Link>
        </div>
      </div>

      <ItemFilters filters={filters} onChange={handleFilters} onReset={() => handleFilters(initialFilters)} />

      {loading ? (
        <Loader />
      ) : data.items.length === 0 ? (
        <p className="py-16 text-center text-slate-500">No items match your filters.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">{data.total} item(s) found</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <ItemCard key={item._id} item={item} distanceKm={distanceFor(item)} />
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm">Page {page} of {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}