import useAuth from '../../hooks/useAuth';

export default function MyReports() {
  const { user } = useAuth();
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome, {user.name}. Your reports will appear here in Phase 2.</p>
      <p className="mt-1 text-sm text-slate-500">
        Email: {user.email} | Role: {user.role} | Points: {user.reputationPoints}
      </p>
    </div>
  );
}