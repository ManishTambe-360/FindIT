import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminNav from '../../components/admin/AdminNav';
import Loader from '../../components/common/Loader';
import { Pager } from './ManageUsers';
import { getAdminItems } from '../../services/adminService';
import { deleteItem, updateItemStatus } from '../../services/itemService';
import { CATEGORIES, STATUS_STYLES, TYPE_STYLES, formatDate } from '../../utils/helpers';

export default function ManageItems() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const page = parseInt(params.get('page')) || 1;

  useEffect(() => {
    getAdminItems({
      search: params.get('search') || undefined,
      type: type || undefined,
      status: status || undefined,
      category: category || undefined,
      page,
    })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load items'));
  }, [params, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (params.get('search') || '')) update({ search });
    }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (item, fn, success) => {
    setBusyId(item._id);
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

  const toggleReturned = (item) => {
    const next = item.status === 'returned' ? 'open' : 'returned';
    act(item, () => updateItemStatus(item._id, next), next === 'returned' ? 'Marked as returned' : 'Item reopened');
  };

  const remove = (item) => {
    if (!window.confirm(`Delete "${item.title}"? Its photos, claims and matches will be removed too.`)) return;
    act(item, () => deleteItem(item._id), 'Item deleted');
  };

  const clearFilters = () => {
    setSearch('');
    setParams(new URLSearchParams());
  };
  const filtered = Boolean(params.toString());

  return (
    <div className="py-8">
      <AdminNav title="Items" subtitle={data ? `${data.total} item${data.total === 1 ? '' : 's'}` : ' '} />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          id="admin-item-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, place…"
          className="min-w-56 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <select value={type} onChange={(e) => update({ type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Lost & found</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select value={status} onChange={(e) => update({ status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="returned">Returned</option>
        </select>
        <select value={category} onChange={(e) => update({ category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {filtered && (
          <button onClick={clearFilters} className="px-2 text-sm text-slate-500 hover:text-slate-800">Clear</button>
        )}
      </div>

      {!data ? (
        <Loader />
      ) : data.items.length === 0 ? (
        <p className="rounded-xl bg-white py-12 text-center text-sm text-slate-500">No items match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Posted by</th>
                  <th className="px-4 py-3 text-center">Claims</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((item) => (
                  <tr key={item._id} className={`hover:bg-slate-50 ${busyId === item._id ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {item.images?.[0]?.url && <img src={item.images[0].url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/items/${item._id}`} className="block max-w-xs truncate font-medium hover:underline">
                            {item.title}
                          </Link>
                          <p className="text-xs text-slate-500">
                            <span className={`mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_STYLES[item.type]}`}>
                              {item.type}
                            </span>
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.postedBy ? (
                        <>
                          <p className="font-medium">
                            {item.postedBy.name}
                            {item.postedBy.isBlocked && <span className="ml-1 text-xs text-red-600">(blocked)</span>}
                          </p>
                          <p className="text-xs text-slate-500">{item.postedBy.email}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">deleted user</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{item.claimCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5 whitespace-nowrap">
                        <button
                          disabled={busyId === item._id}
                          onClick={() => toggleReturned(item)}
                          className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-slate-100"
                        >
                          {item.status === 'returned' ? 'Reopen' : 'Mark returned'}
                        </button>
                        <button
                          disabled={busyId === item._id}
                          onClick={() => remove(item)}
                          className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pages={data.pages} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
