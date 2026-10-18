import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-5xl font-extrabold">
        Lost something? <span className="text-indigo-600">FindIt.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-600">
        A smart lost and found platform that matches lost items with found ones,
        so belongings get back to their owners faster.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link to="/browse" className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
            Browse items
        </Link>
        <Link to="/report?type=lost" className="rounded-lg border px-6 py-3 font-medium hover:bg-white">
            I lost something
        </Link>
        <Link to="/report?type=found" className="rounded-lg border px-6 py-3 font-medium hover:bg-white">
            I found something
        </Link>
        </div>
    </div>
  );
}