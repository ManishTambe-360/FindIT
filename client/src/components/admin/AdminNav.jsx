import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/items', label: 'Items' },
];

// Shared header + tab bar for every admin page
export default function AdminNav({ title, subtitle, children }) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Admin panel</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </div>
      <nav className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
