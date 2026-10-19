import L from 'leaflet';

const COLORS = { lost: '#dc2626', found: '#059669' };

// Teardrop pin: red for lost, green for found. Closed items are faded.
export const getPinIcon = (type, status = 'open') => {
  const color = COLORS[type] || '#4f46e5';
  const opacity = status === 'open' ? 1 : 0.5;

  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;
      border-radius:50% 50% 50% 0;
      background:${color};
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.45);
      opacity:${opacity};"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 30],
    popupAnchor: [0, -30],
  });
};