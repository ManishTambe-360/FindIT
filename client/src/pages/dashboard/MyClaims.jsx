import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { getMyClaims, getReceivedClaims, updateClaimStatus } from '../../services/claimService';
import { CLAIM_STYLES, formatDate } from '../../utils/helpers';

function Contact({ title, person }) {
  return (
    <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
      <p className="font-medium">{title}</p>
      <p>{person.name}</p>
      <p>Email: {person.email}</p>
      {person.phone && <p>Phone: {person.phone}</p>}
    </div>
  );
}

function ClaimShell({ claim, children }) {
  const img = claim.item.images?.[0]?.url;
  return (
    <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/items/${claim.item._id}`} className="truncate font-semibold hover:text-indigo-600">
            {claim.item.title}
          </Link>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${CLAIM_STYLES[claim.status]}`}>
            {claim.status}
          </span>
          <span className="text-xs text-slate-400">{formatDate(claim.createdAt)}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MyClaims() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'received' ? 'received' : 'made';
  const [made, setMade] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    Promise.all([getMyClaims(), getReceivedClaims()])
      .then(([a, b]) => {
        setMade(a.data.claims);
        setReceived(b.data.claims);
      })
      .catch(() => toast.error('Could not load claims'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const act = async (claim, status) => {
    if (status === 'approved') {
      const warn = claim.answerMatches === false ? 'The verification answer does NOT match.\n\n' : '';
      const ok = window.confirm(
        `${warn}Approve this claim? Contact details will be shared with both of you and all other pending claims will be rejected.`
      );
      if (!ok) return;
    }
    let note = '';
    if (status === 'rejected') {
      note = window.prompt('Reason for rejecting (optional, shown to the claimant):') ?? null;
      if (note === null) return; // cancelled
    }
    if (status === 'withdrawn' && !window.confirm('Withdraw this claim?')) return;

    setBusyId(claim._id);
    try {
      await updateClaimStatus(claim._id, status, note);
      toast.success(`Claim ${status}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const pendingReceived = received.filter((c) => c.status === 'pending').length;
  const list = tab === 'received' ? received : made;

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Claims</h1>

      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setParams({})}
          className={`rounded-full px-4 py-1.5 font-medium ${tab === 'made' ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-100'}`}
        >
          Claims I made ({made.length})
        </button>
        <button
          onClick={() => setParams({ tab: 'received' })}
          className={`rounded-full px-4 py-1.5 font-medium ${tab === 'received' ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-100'}`}
        >
          Claims on my items ({received.length})
          {pendingReceived > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{pendingReceived} new</span>
          )}
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-slate-500">
          {tab === 'received' ? 'Nobody has claimed your items yet.' : 'You have not made any claims yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {tab === 'made' &&
            made.map((c) => (
              <ClaimShell key={c._id} claim={c}>
                <p className="mt-1 text-sm text-slate-600">Your message: {c.message}</p>
                {c.status === 'rejected' && c.ownerNote && (
                  <p className="mt-1 text-sm text-red-600">Reason: {c.ownerNote}</p>
                )}
                {c.status === 'approved' && (
                  <Contact title="Approved! Contact the poster to arrange the handover:" person={c.itemOwner} />
                )}
                {c.status === 'pending' && (
                  <button
                    disabled={busyId === c._id}
                    onClick={() => act(c, 'withdrawn')}
                    className="mt-3 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    Withdraw claim
                  </button>
                )}
              </ClaimShell>
            ))}

          {tab === 'received' &&
            received.map((c) => (
              <ClaimShell key={c._id} claim={c}>
                <p className="mt-1 text-sm">
                  <span className="text-slate-500">From</span> <strong>{c.claimant.name}</strong>
                </p>
                <p className="mt-1 text-sm text-slate-600">"{c.message}"</p>

                {c.item.verificationQuestion && (
                  <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-500">Q: {c.item.verificationQuestion}</p>
                    <p>A: {c.answer || '(no answer)'}</p>
                    {c.answerMatches === true && (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Answer matches ✓
                      </span>
                    )}
                    {c.answerMatches === false && (
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Answer does not match ✗
                      </span>
                    )}
                  </div>
                )}

                {c.status === 'rejected' && c.ownerNote && (
                  <p className="mt-1 text-sm text-slate-500">Note: {c.ownerNote}</p>
                )}
                {c.status === 'approved' && <Contact title="Claimant's contact details:" person={c.claimant} />}

                {c.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busyId === c._id}
                      onClick={() => act(c, 'approved')}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === c._id}
                      onClick={() => act(c, 'rejected')}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </ClaimShell>
            ))}
        </div>
      )}
    </div>
  );
}