import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>
      <p className="mt-2 text-slate-600">Page not found</p>
      <Link to="/" className="mt-4 inline-block text-indigo-600 underline">Go home</Link>
    </div>
  );
}