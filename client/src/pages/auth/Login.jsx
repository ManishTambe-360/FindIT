import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      const fallback = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Login to FindIt</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email" name="email" placeholder="Email" required
          value={form.email} onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 focus:outline-indigo-500"
        />
        <input
          type="password" name="password" placeholder="Password" required
          value={form.password} onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 focus:outline-indigo-500"
        />
        <button
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        New here? <Link to="/register" className="text-indigo-600">Create an account</Link>
      </p>
    </div>
  );
}