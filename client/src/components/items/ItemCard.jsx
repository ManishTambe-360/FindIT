import { Link } from 'react-router-dom';
import { STATUS_STYLES, TYPE_STYLES, formatDate } from '../../utils/helpers';

export default function ItemCard({ item }) {
  const image = item.images?.[0]?.url;

  return (
    <Link
      to={`/items/${item._id}`}
      className="block overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-44 bg-slate-100">
        {image ? (
          <img src={image} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${TYPE_STYLES[item.type]}`}>
          {item.type}
        </span>
      </div>

      <div className="space-y-1 p-4">
        <h3 className="truncate font-semibold">{item.title}</h3>
        <p className="text-sm text-slate-500">{item.category}</p>
        <p className="truncate text-sm text-slate-500">{item.address || 'Location pinned on map'}</p>
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-500">{formatDate(item.date)}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${STATUS_STYLES[item.status]}`}>
            {item.status}
          </span>
        </div>
      </div>
    </Link>
  );
}