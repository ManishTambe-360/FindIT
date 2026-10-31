import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-7xl font-extrabold text-transparent">
        404
      </h1>
      <p className="mt-2 text-lg font-semibold">Looks like this page got lost too.</p>
      <p className="mt-1 text-sm text-slate-500">The link may be broken, or the item was removed.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={() => navigate(-1)} className="rounded-xl border bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">
          ← Go back
        </button>
        <Link to="/browse" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
          Browse items
        </Link>
      </div>
    </div>
  );
}