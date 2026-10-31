import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  const cols = [
    {
      title: 'Explore',
      links: [
        { to: '/browse', label: 'Browse items' },
        { to: '/map', label: 'Map view' },
        { to: '/report?type=lost', label: 'Report lost' },
        { to: '/report?type=found', label: 'Report found' },
      ],
    },
    {
      title: 'Your account',
      links: user
        ? [
            { to: '/dashboard', label: 'My reports' },
            { to: '/claims', label: 'Claims' },
            { to: '/chats', label: 'Messages' },
            { to: '/notifications', label: 'Notifications' },
          ]
        : [
            { to: '/login', label: 'Log in' },
            { to: '/register', label: 'Create account' },
          ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Find<span className="text-slate-800">It</span>
          </Link>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            A smart lost &amp; found platform. We match lost and found reports by place, date and description,
            then let you chat safely to arrange the handover.
          </p>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Safety tip: meet in a public place, and never share card numbers or passwords in chat.
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-600 transition hover:text-indigo-600">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {year} FindIt · Built with React, Express &amp; MongoDB
      </div>
    </footer>
  );
}