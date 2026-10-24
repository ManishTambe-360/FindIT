import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { useSocket } from '../../context/SocketContext';
import {
  clearReadNotifications, deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead,
} from '../../services/notificationService';
import { NOTIFICATION_META, timeAgo } from '../../utils/notifications';

export default function Notifications() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (p = 1) =>
      getNotifications({ page: p, unread: filter === 'unread' ? 'true' : undefined })
        .then((res) => {
          setList((prev) => (p === 1 ? res.data.notifications : [...prev, ...res.data.notifications]));
          setPage(res.data.page);
          setPages(res.data.pages);
          setUnread(res.data.unread);
        })
        .catch(() => toast.error('Could not load notifications'))
        .finally(() => setLoading(false)),
    [filter]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // new notifications appear at the top instantly
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (n) => {
      setList((prev) => (prev.some((x) => x._id === n._id) ? prev : [n, ...prev]));
      setUnread((u) => u + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  const notifyNavbar = () => window.dispatchEvent(new Event('notifications:changed'));

  const open = async (n) => {
    if (!n.read) {
      markNotificationRead(n._id).then(notifyNavbar).catch(() => {});
      setList((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(u - 1, 0));
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setList((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
      notifyNavbar();
    } catch {
      toast.error('Failed');
    }
  };

  const remove = async (e, n) => {
    e.stopPropagation();
    try {
      await deleteNotification(n._id);
      setList((prev) => prev.filter((x) => x._id !== n._id));
      if (!n.read) {
        setUnread((u) => Math.max(u - 1, 0));
        notifyNavbar();
      }
    } catch {
      toast.error('Failed');
    }
  };

  const clearRead = async () => {
    try {
      const res = await clearReadNotifications();
      setList((prev) => prev.filter((x) => !x.read));
      toast.success(`Removed ${res.data.deleted} read notification${res.data.deleted === 1 ? '' : 's'}`);
    } catch {
      toast.error('Failed');
    }
  };

  const changeFilter = (f) => {
    if (f === filter) return;
    setLoading(true);
    setFilter(f);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={readAll}
            disabled={unread === 0}
            className="rounded-lg border px-3 py-1.5 font-medium hover:bg-white disabled:opacity-40"
          >
            Mark all read
          </button>
          <button onClick={clearRead} className="rounded-lg border px-3 py-1.5 font-medium text-slate-600 hover:bg-white">
            Clear read
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`rounded-full px-4 py-1.5 font-medium capitalize ${filter === f ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : list.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center text-slate-500">
          <p className="text-3xl">🔔</p>
          <p className="mt-2">No notifications {filter === 'unread' ? 'unread' : 'yet'}.</p>
          <p className="text-xs">You'll hear about matches, claims and messages here.</p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl bg-white shadow-sm">
          {list.map((n) => {
            const meta = NOTIFICATION_META[n.type] || NOTIFICATION_META.match;
            return (
              <li
                key={n._id}
                onClick={() => open(n)}
                className={`group flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-slate-50 ${n.read ? '' : 'bg-indigo-50/50'}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${meta.color}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${n.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</p>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{n.body}</p>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" title="Unread" />}
                  <button
                    onClick={(e) => remove(e, n)}
                    className="text-xs text-slate-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && page < pages && (
        <div className="text-center">
          <button onClick={() => load(page + 1)} className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
