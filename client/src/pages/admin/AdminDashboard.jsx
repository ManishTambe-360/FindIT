import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
import StatsCards, { CategoryBars, DailyChart } from '../../components/admin/StatsCards';
import Loader from '../../components/common/Loader';
import { getAdminStats } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load stats'));
  }, []);

  return (
    <div className="py-8">
      <AdminNav title="Overview" subtitle="How FindIt is doing right now" />

      {error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : !stats ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          <StatsCards stats={stats} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailyChart data={stats.daily} />
            </div>
            <CategoryBars categories={stats.categories} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Top finders</h2>
              {stats.topUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No reputation points awarded yet.</p>
              ) : (
                <ol className="space-y-2">
                  {stats.topUsers.map((u, i) => (
                    <li key={u._id} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                        {i + 1}
                      </span>
                      <span className="flex-1">{u.name}</span>
                      <span className="font-semibold text-slate-700">{u.reputationPoints} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Needs attention</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600">Blocked accounts</span>
                  <Link to="/admin/users?status=blocked" className="font-medium text-indigo-600 hover:underline">
                    {stats.users.blocked} →
                  </Link>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Claimed, not yet returned</span>
                  <Link to="/admin/items?status=claimed" className="font-medium text-indigo-600 hover:underline">
                    {stats.items.claimed} →
                  </Link>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Open lost reports</span>
                  <Link to="/admin/items?type=lost&status=open" className="font-medium text-indigo-600 hover:underline">
                    view →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}