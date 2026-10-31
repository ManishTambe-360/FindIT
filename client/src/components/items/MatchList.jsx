import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dismissMatch, getItemMatches, refreshItemMatches } from '../../services/matchService';
import { startConversation } from '../../services/chatService';
import { TYPE_STYLES, formatDate, formatDistance } from '../../utils/helpers';

const scoreStyle = (s) =>
  s >= 70 ? 'bg-green-100 text-green-700' : s >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600';

// Suggested matches for an item. Only rendered for the item's poster/admin.
export default function MatchList({ item }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const message = async (otherItemId) => {
    try {
      const res = await startConversation(otherItemId);
      navigate(`/chats/${res.data.conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start chat');
    }
  };

  // ItemDetails gives this component key={item._id}, so it remounts per item
  useEffect(() => {
    getItemMatches(item._id)
      .then((res) => setMatches(res.data.matches))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [item._id]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshItemMatches(item._id);
      setMatches(res.data.matches);
      toast.success(`${res.data.matches.length} possible match${res.data.matches.length === 1 ? '' : 'es'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const hide = async (id) => {
    try {
      await dismissMatch(id);
      setMatches((m) => m.filter((x) => x._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const other = item.type === 'lost' ? 'found' : 'lost';

  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Possible matches</h2>
          <p className="text-xs text-slate-500">
            Open {other} reports in the same category, nearby and around the same date.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Looking for matches…</p>
      ) : item.status !== 'open' ? (
        <p className="text-sm text-slate-500">Matching is paused while this item is {item.status}.</p>
      ) : matches.length === 0 ? (
        <p className="text-sm text-slate-500">
          No matches yet. We check again automatically whenever a new {other} item is reported.
        </p>
      ) : (
        <ul className="divide-y">
          {matches.map((m) => (
            <li key={m._id} className="flex gap-4 py-3">
              <Link to={`/items/${m.item._id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {m.item.images?.[0]?.url ? (
                  <img src={m.item.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-slate-400">No photo</span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/items/${m.item._id}`} className="truncate font-medium hover:underline">
                    {m.item.title}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_STYLES[m.item.type]}`}>
                    {m.item.type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreStyle(m.score)}`}>
                    {m.score}% match
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDistance(m.distanceKm)} · {formatDate(m.item.date)} · by {m.item.postedBy?.name || 'Unknown'}
                </p>
                {m.commonWords?.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">
                    Shared keywords:{' '}
                    {m.commonWords.map((w) => (
                      <span key={w} className="mr-1 rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">{w}</span>
                    ))}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 self-start">
                <button onClick={() => message(m.item._id)} className="text-xs font-medium text-indigo-600 hover:underline">
                  Message
                </button>
                <button
                  onClick={() => hide(m._id)}
                  title="Not my item"
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Hide
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
