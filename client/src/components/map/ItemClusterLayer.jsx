import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { getPinIcon } from '../../utils/mapIcons';
import { formatDate } from '../../utils/helpers';

// Popup is built with DOM nodes + textContent (never innerHTML),
// so user-written titles can't inject HTML/JS.
const buildPopup = (item, onOpen) => {
  const box = document.createElement('div');
  box.style.minWidth = '170px';

  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    img.style.cssText = 'width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px';
    box.appendChild(img);
  }

  const title = document.createElement('strong');
  title.textContent = item.title;
  title.style.display = 'block';

  const meta = document.createElement('div');
  meta.textContent = `${item.type.toUpperCase()} · ${item.category} · ${formatDate(item.date)}`;
  meta.style.cssText = 'font-size:12px;color:#64748b;margin:2px 0 8px';

  const btn = document.createElement('button');
  btn.textContent = 'View details';
  btn.style.cssText =
    'background:#4f46e5;color:#fff;border:0;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer';
  btn.onclick = () => onOpen(item._id);

  box.append(title, meta, btn);
  return box;
};

const clusterIcon = (cluster) =>
  L.divIcon({
    className: '',
    iconSize: [40, 40],
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#4f46e5;color:#fff;
      display:flex;align-items:center;justify-content:center;font-weight:700;
      border:3px solid #c7d2fe;box-shadow:0 1px 5px rgba(0,0,0,.4)">${cluster.getChildCount()}</div>`,
  });

export default function ItemClusterLayer({ items, onOpen, fit = true }) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: clusterIcon,
    });

    items.forEach((item) => {
      const [lng, lat] = item.location.coordinates; // GeoJSON = [lng, lat]
      const marker = L.marker([lat, lng], {
        icon: getPinIcon(item.type, item.status),
        title: item.title,
      });
      marker.bindPopup(buildPopup(item, onOpen));
      group.addLayer(marker);
    });

    map.addLayer(group);
    if (fit && items.length) {
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 16 });
    }

    return () => {
      map.removeLayer(group);
    };
  }, [items, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}