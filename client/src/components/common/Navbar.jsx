import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { getPendingCount } from '../../services/claimService';
import { getUnreadChatCount } from '../../services/chatService';
import { getUnreadNotificationCount } from '../../services/notificationService';
import { NOTIFICATION_META } from '../../utils/notifications';
import { useSocket } from '../../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pending, setPending] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Refresh the badge on every page change, and once a minute
  useEffect(() => {
    if (!user) {
      setPending(0);
      return;
    }
    let alive = true;
    const load = () =>
      getPendingCount()
        .then((res) => alive && setPending(res.data.count))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user, pathname]);

  // Unread chat badge: refresh on page change and whenever a message/read event arrives
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      getUnreadChatCount()
        .then((res) => alive && setUnreadChats(res.data.count))
        .catch(() => {});
    load();
    // small delay so the server has stored the read/unread change first
    const onEvent = () => setTimeout(load, 300);
    socket?.on('chat:message', onEvent);
    socket?.on('chat:read', onEvent);
    return () => {
      alive = false;
      socket?.off('chat:message', onEvent);
      socket?.off('chat:read', onEvent);
    };
  }, [user, pathname, socket]);

  // Notification bell: count + a toast for each new notification
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      getUnreadNotificationCount()
        .then((res) => alive && setUnreadNotifs(res.data.count))
        .catch(() => {});
    load();

    const onNew = (n) => {
      setUnreadNotifs((c) => c + 1);
      if (pathname === '/notifications') return; // the page shows it already
      if (n.type === 'message' && pathname.startsWith('/chats')) return;
      const meta = NOTIFICATION_META[n.type] || {};
      toast(
        (t) => (
          <button
            className="text-left"
            onClick={() => {
              toast.dismiss(t.id);
              if (n.link) navigate(n.link);
            }}
          >
            <p className="text-sm font-semibold">{n.title}</p>
            {n.body && <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>}
          </button>
        ),
        { icon: meta.icon || '🔔', duration: 6000 }
      );
    };
    socket?.on('notification:new', onNew);
    window.addEventListener('notifications:changed', load);
    return () => {
      alive = false;
      socket?.off('notification:new', onNew);
      window.removeEventListener('notifications:changed', load);
    };
  }, [user, pathname, socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          Find<span className="text-slate-800">It</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <Link to="/browse" className="hover:text-indigo-600">Browse</Link>
          <Link to="/map" className="hover:text-indigo-600">Map</Link>
          <Link to="/report" className="hover:text-indigo-600">Report</Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
              <Link to={pending > 0 ? '/claims?tab=received' : '/claims'} className="relative hover:text-indigo-600">
                Claims
                {pending > 0 && (
                  <span className="absolute -right-4 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                    {pending}
                  </span>
                )}
              </Link>
              <Link to="/chats" className="relative hover:text-indigo-600">
                Messages
                {unreadChats > 0 && (
                  <span className="absolute -right-4 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs text-white">
                    {unreadChats}
                  </span>
                )}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-indigo-600">Admin</Link>
              )}
              <Link to="/notifications" id="notification-bell" title="Notifications" className="relative text-lg leading-none hover:text-indigo-600">
                <span aria-hidden>🔔</span>
                <span className="sr-only">Notifications</span>
                {unreadNotifs > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </Link>
              <span className="text-slate-500">Hi, {user.name.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-600">Login</Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}