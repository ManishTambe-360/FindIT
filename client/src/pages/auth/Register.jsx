import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setSubmitting(true);
    try {
      const { name, email, phone, password } = form;
      await register({ name, email, phone, password });
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const input = 'w-full rounded-lg border px-3 py-2 focus:outline-indigo-500';

  return (
    <div className="mx-auto mt-12 max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Full name" required value={form.name} onChange={handleChange} className={input} />
        <input type="email" name="email" placeholder="Email" required value={form.email} onChange={handleChange} className={input} />
        <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className={input} />
        <input type="password" name="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={handleChange} className={input} />
        <input type="password" name="confirm" placeholder="Confirm password" required value={form.confirm} onChange={handleChange} className={input} />
        <button
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-indigo-600">Login</Link>
      </p>
    </div>
  );
}