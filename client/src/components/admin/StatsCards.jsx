// Small presentational pieces for the admin overview

export function StatCard({ label, value, hint, accent = 'indigo' }) {
  const accents = {
    indigo: 'from-indigo-500 to-indigo-600',
    red: 'from-rose-500 to-red-600',
    green: 'from-emerald-500 to-green-600',
    amber: 'from-amber-400 to-amber-500',
    slate: 'from-slate-500 to-slate-700',
    sky: 'from-sky-500 to-sky-600',
  };
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accents[accent]}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function StatsCards({ stats }) {
  const { users, items, claims, matches, chats } = stats;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Users" value={users.total} hint={`+${users.new7d} this week · ${users.blocked} blocked`} />
      <StatCard label="Items reported" value={items.total} hint={`${items.lost} lost · ${items.found} found`} accent="sky" />
      <StatCard label="Recovery rate" value={`${items.recoveryRate}%`} hint={`${items.returned} returned to owners`} accent="green" />
      <StatCard label="Pending claims" value={claims.pending} hint={`${claims.approved} approved · ${claims.rejected} rejected`} accent="amber" />
      <StatCard label="Open items" value={items.open} hint={`${items.claimed} claimed, awaiting handover`} accent="slate" />
      <StatCard label="Matches found" value={matches} hint="Suggested lost ↔ found pairs" accent="indigo" />
      <StatCard label="Conversations" value={chats.conversations} hint={`${chats.messages} messages sent`} accent="sky" />
      <StatCard label="Admins" value={users.admins} hint="Accounts with admin access" accent="red" />
    </div>
  );
}

// 14-day stacked bar chart (lost + found), plain divs, no chart library
export function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.lost + d.found));
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Reports in the last 14 days</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Lost</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Found</span>
        </div>
      </div>
      <div className="flex h-44 items-end gap-1.5">
        {data.map((d) => {
          const total = d.lost + d.found;
          const label = new Date(d.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          return (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white group-hover:block">
                {label}: {d.lost} lost, {d.found} found
              </span>
              <div className="flex flex-col overflow-hidden rounded-t" style={{ height: `${(total / max) * 100}%` }}>
                <div className="bg-emerald-400 transition-all" style={{ flex: d.found }} />
                <div className="bg-rose-400 transition-all" style={{ flex: d.lost }} />
              </div>
              {total === 0 && <div className="h-0.5 rounded bg-slate-200" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{new Date(data[0].day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export function CategoryBars({ categories }) {
  const max = Math.max(1, ...categories.map((c) => c.count));
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold">Items by category</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-500">No items yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {categories.map((c) => (
            <li key={c.category}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-600">{c.category}</span>
                <span className="font-medium text-slate-800">{c.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${(c.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
