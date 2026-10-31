import { formatDate } from '../../utils/helpers';

// Table of users with admin actions. Parent handles the API calls.
export default function UserTable({ users, currentUserId, busyId, onToggleBlock, onToggleRole, onDelete }) {
  if (users.length === 0) {
    return <p className="rounded-xl bg-white py-12 text-center text-sm text-slate-500">No users match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Items</th>
            <th className="px-4 py-3 text-center">Points</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => {
            const self = u._id === currentUserId;
            const busy = busyId === u._id;
            return (
              <tr key={u._id} className={`hover:bg-slate-50 ${busy ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name} {self && <span className="text-xs text-slate-400">(you)</span>}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{u.itemCount}</td>
                <td className="px-4 py-3 text-center">{u.reputationPoints}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {self ? (
                    <p className="text-right text-xs text-slate-400">—</p>
                  ) : (
                    <div className="flex justify-end gap-1.5 whitespace-nowrap">
                      <button
                        disabled={busy}
                        onClick={() => onToggleRole(u)}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-slate-100"
                      >
                        {u.role === 'admin' ? 'Make user' : 'Make admin'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => onToggleBlock(u)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${u.isBlocked ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => onDelete(u)}
                        className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
