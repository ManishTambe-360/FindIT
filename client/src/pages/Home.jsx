import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ItemCard from '../components/items/ItemCard';
import { getItems } from '../services/itemService';

const STEPS = [
  { icon: '📝', title: 'Report it', text: 'Describe what you lost or found, add photos and pin the spot on the map.' },
  { icon: '🔍', title: 'Get matched', text: 'We compare category, distance, date and keywords to suggest likely pairs.' },
  { icon: '💬', title: 'Verify & chat', text: 'Claim with a secret answer only the owner knows, then chat in-app.' },
  { icon: '🎉', title: 'Hand it back', text: 'Meet up, mark it returned, and the finder earns reputation points.' },
];

// Decorative floating cards on the right of the hero
function HeroVisual() {
  return (
    <div className="relative mx-auto h-80 w-full max-w-md" aria-hidden>
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-300/40 via-purple-300/30 to-emerald-200/40 blur-3xl" />

      <div className="absolute left-0 top-6 w-56 -rotate-6 animate-float rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100">
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">Lost</span>
        <p className="mt-2 font-semibold">Black leather wallet</p>
        <p className="text-xs text-slate-500">Library, 2nd floor · Yesterday</p>
      </div>

      <div className="absolute bottom-6 right-0 w-56 rotate-3 animate-float-slow rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Found</span>
        <p className="mt-2 font-semibold">Wallet with ID cards</p>
        <p className="text-xs text-slate-500">Library entrance · Today</p>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
        94% match ✨
      </div>
    </div>
  );
}

export default function Home() {
  const [recent, setRecent] = useState([]);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    getItems({ limit: 4, status: 'open' }).then((r) => setRecent(r.data.items)).catch(() => {});
    Promise.all([
      getItems({ limit: 1, type: 'lost' }),
      getItems({ limit: 1, type: 'found' }),
      getItems({ limit: 1, status: 'returned' }),
    ])
      .then(([l, f, r]) => setCounts({ lost: l.data.total, found: f.data.total, returned: r.data.total }))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-12 md:grid-cols-2 md:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Smart matching, real-time chat
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Lost something?{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FindIt.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-slate-600">
            We match lost items with found ones using location, date and description, so belongings get back to
            their owners faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              id="cta-lost"
              to="/report?type=lost"
              className="rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:-translate-y-0.5 hover:bg-rose-700"
            >
              I lost something
            </Link>
            <Link
              id="cta-found"
              to="/report?type=found"
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              I found something
            </Link>
            <Link
              to="/browse"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
            >
              Browse items →
            </Link>
          </div>

          {counts && (
            <dl className="mt-10 flex gap-8">
              {[
                ['Lost reports', counts.lost],
                ['Found reports', counts.found],
                ['Reunited', counts.returned],
              ].map(([label, n]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-2xl font-bold text-slate-800">{n}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <HeroVisual />
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
        <p className="mt-2 text-center text-slate-500">Four steps from "oh no" to "got it back".</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="absolute right-4 top-4 text-xs font-bold text-slate-300">0{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition group-hover:scale-110">
                {s.icon}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Recent items */}
      {recent.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recently reported</h2>
              <p className="text-sm text-slate-500">Recognise something? Open it to claim or message the poster.</p>
            </div>
            <Link to="/browse" className="text-sm font-medium text-indigo-600 hover:underline">See all →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((item) => <ItemCard key={item._id} item={item} />)}
          </div>
        </section>
      )}

      {/* Map CTA */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-8 py-12 text-white shadow-xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">See what's been found near you</h2>
            <p className="mt-2 max-w-xl text-indigo-100">
              Open the map, tap "near me" and check every open report around you.
            </p>
          </div>
          <Link
            to="/map"
            className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow transition hover:-translate-y-0.5"
          >
            Open the map
          </Link>
        </div>
      </section>
    </div>
  );
}