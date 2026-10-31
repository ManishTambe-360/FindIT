import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminNav from '../../components/admin/AdminNav';
import UserTable from '../../components/admin/UserTable';
import Pager from '../../components/admin/Pager';
import Loader from '../../components/common/Loader';
import useAuth from '../../hooks/useAuth';
import { deleteUser, getAdminUsers, setUserBlocked, setUserRole } from '../../services/adminService';

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  const role = params.get('role') || '';
  const status = params.get('status') || '';
  const page = parseInt(params.get('page')) || 1;

  useEffect(() => {
    getAdminUsers({ search: params.get('search') || undefined, role: role || undefined, status: status || undefined, page })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load users'));
  }, [params, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (params.get('search') || '')) update({ search });
    }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (u, fn, success) => {
    setBusyId(u._id);
    try {
      await fn();
      toast.success(success);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const onToggleBlock = (u) => {
    if (!u.isBlocked && !window.confirm(`Block ${u.name}? They won't be able to log in or use FindIt.`)) return;
    act(u, () => setUserBlocked(u._id, !u.isBlocked), u.isBlocked ? `${u.name} unblocked` : `${u.name} blocked`);
  };

  const onToggleRole = (u) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${u.name}'s role to ${role}?`)) return;
    act(u, () => setUserRole(u._id, role), `${u.name} is now ${role === 'admin' ? 'an admin' : 'a user'}`);
  };

  const onDelete = (u) => {
    const typed = window.prompt(
      `This permanently deletes ${u.name}, their ${u.itemCount} item(s), claims and chats.\n\nType DELETE to confirm.`
    );
    if (typed !== 'DELETE') return;
    act(u, () => deleteUser(u._id), `${u.name} deleted`);
  };

  return (
    <div className="py-8">
      <AdminNav title="Users" subtitle={data ? `${data.total} account${data.total === 1 ? '' : 's'}` : ' '} />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          id="admin-user-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="min-w-56 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <select value={role} onChange={(e) => update({ role: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <select value={status} onChange={(e) => update({ status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {!data ? (
        <Loader />
      ) : (
        <>
          <UserTable
            users={data.users}
            currentUserId={me._id}
            busyId={busyId}
            onToggleBlock={onToggleBlock}
            onToggleRole={onToggleRole}
            onDelete={onDelete}
          />
          <Pager page={data.page} pages={data.pages} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
