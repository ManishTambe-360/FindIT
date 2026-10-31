import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ItemCard from '../../components/items/ItemCard';
import Loader from '../../components/common/Loader';
import useAuth from '../../hooks/useAuth';
import { getMyItems } from '../../services/itemService';
import { getMyMatchCounts } from '../../services/matchService';

export default function MyReports() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [matchCounts, setMatchCounts] = useState({});
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyItems()
      .then((res) => setItems(res.data.items))
      .catch(() => toast.error('Could not load your reports'))
      .finally(() => setLoading(false));
    getMyMatchCounts()
      .then((res) => setMatchCounts(res.data.counts))
      .catch(() => {});
  }, []);

  const shown = tab === 'all' ? items : items.filter((i) => i.type === tab);

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My reports</h1>
          <p className="text-sm text-slate-500">
            {user.name} · {user.email} · {user.reputationPoints} points
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/report?type=lost" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Report lost</Link>
          <Link to="/report?type=found" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Report found</Link>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        {['all', 'lost', 'found'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 font-medium capitalize ${tab === t ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-100'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-slate-500">Nothing here yet. Report your first item!</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <div key={item._id} className="relative">
              <ItemCard item={item} />
              {matchCounts[item._id] > 0 && (
                <span className="pointer-events-none absolute bottom-[4.5rem] right-2 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                  {matchCounts[item._id]} possible match{matchCounts[item._id] === 1 ? '' : 'es'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}