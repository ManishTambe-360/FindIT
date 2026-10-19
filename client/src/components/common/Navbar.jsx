import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          Find<span className="text-slate-800">It</span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <Link to="/browse" className="hover:text-indigo-600">Browse</Link>
          <Link to="/report" className="hover:text-indigo-600">Report</Link>
          <Link to="/map" className="hover:text-indigo-600">Map</Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-indigo-600">Admin</Link>
              )}
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