import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import ItemClusterLayer from '../components/map/ItemClusterLayer';
import { getMapItems } from '../services/itemService';
import { CATEGORIES, DEFAULT_CENTER } from '../utils/helpers';

const initialFilters = {
  type: '', category: '', status: 'open', near: false, lat: '', lng: '', radius: 5,
};

// Zooms the map so the whole search circle is visible
function FitCircle({ center, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.circle([center.lat, center.lng], { radius: radiusKm * 1000 }).getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [center.lat, center.lng, radiusKm, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ items: [], total: 0, truncated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.near && filters.lat !== '') {
      params.lat = filters.lat;
      params.lng = filters.lng;
      params.radius = filters.radius;
    }

    getMapItems(params)
      .then((res) => !cancelled && setData(res.data))
      .catch(() => toast.error('Could not load map items'))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [filters]);

  const set = (name, value) => setFilters({ ...filters, [name]: value });

  const toggleNear = (checked) => {
    if (!checked) return setFilters({ ...filters, near: false, lat: '', lng: '' });
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFilters({ ...filters, near: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error('Could not get your location')
    );
  };

  const nearActive = filters.near && filters.lat !== '';
  const select = 'rounded-lg border bg-white px-3 py-2 text-sm focus:outline-indigo-500';

  return (
    <div className="space-y-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Map view</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${data.total} item(s)`}
            {data.truncated && ' (showing the 500 most recent)'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-red-600" /> Lost</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-emerald-600" /> Found</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-indigo-600" /> Cluster</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="flex overflow-hidden rounded-lg border text-sm">
          {[['', 'All'], ['lost', 'Lost'], ['found', 'Found']].map(([val, label]) => (
            <button
              key={label}
              onClick={() => set('type', val)}
              className={`px-4 py-2 font-medium ${filters.type === val ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <select value={filters.category} onChange={(e) => set('category', e.target.value)} className={select}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={select}>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="returned">Returned</option>
          <option value="">Any status</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
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

        <button
          onClick={() => setFilters(initialFilters)}
          className="ml-auto rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {/* Map */}
      <div className="relative">
        {loading && (
          <div className="absolute right-3 top-3 z-[1000] rounded-full bg-white px-3 py-1 text-xs shadow">
            Updating...
          </div>
        )}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '70vh', minHeight: '420px', width: '100%' }}
          className="z-0 rounded-xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ItemClusterLayer items={data.items} fit={!nearActive} onOpen={(id) => navigate(`/items/${id}`)} />

          {nearActive && (
            <>
              <FitCircle center={{ lat: filters.lat, lng: filters.lng }} radiusKm={Number(filters.radius)} />
              <Circle
                center={[filters.lat, filters.lng]}
                radius={Number(filters.radius) * 1000}
                pathOptions={{ color: '#4f46e5', weight: 1, fillOpacity: 0.07 }}
              />
              <CircleMarker
                center={[filters.lat, filters.lng]}
                radius={7}
                pathOptions={{ color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {!loading && data.items.length === 0 && (
        <p className="text-center text-sm text-slate-500">No items match these filters.</p>
      )}
    </div>
  );
}