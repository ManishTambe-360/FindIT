import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import '../../utils/leafletIcon';

const DEFAULT_CENTER = [19.076, 72.8777]; // change to your college location

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
  }, [target, map]);
  return null;
}

// value: { lat, lng } | null,  onChange: ({lat, lng}) => void
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [flyTo, setFlyTo] = useState(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(p);
        setFlyTo(p);
      },
      () => toast.error('Could not get your location')
    );
  };

  const searchPlace = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!data.length) return toast.error('Place not found');
      const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      onChange(p);
      setFlyTo(p);
    } catch {
      toast.error('Search failed');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              searchPlace();
            }
          }}
          placeholder="Search a place (e.g. Andheri station)"
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-indigo-500"
        />
        <button type="button" onClick={searchPlace} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">
          Search
        </button>
        <button type="button" onClick={useMyLocation} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
          My location
        </button>
      </div>

      <MapContainer
        center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
        zoom={value ? 16 : 13}
        style={{ height: '320px', width: '100%' }}
        className="z-0 rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <FlyTo target={flyTo} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>

      <p className="text-xs text-slate-500">
        {value
          ? `Pinned: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : 'Click on the map to drop a pin where the item was lost or found.'}
      </p>
    </div>
  );
}