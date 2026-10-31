import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import ItemCard from '../components/items/ItemCard';
import ClaimForm from '../components/items/ClaimForm';
import MatchList from '../components/items/MatchList';
import MapView from '../components/map/MapView';
import useAuth from '../hooks/useAuth';
import { deleteItem, getItem, getItems, updateItemStatus } from '../services/itemService';
import { getMyClaims } from '../services/claimService';
import { startConversation } from '../services/chatService';
import { CLAIM_STYLES, STATUS_STYLES, TYPE_STYLES, formatDate } from '../utils/helpers';

const MAX_ATTEMPTS = 3;

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null); // which id/user the current `item` belongs to
  const [active, setActive] = useState(0);
  const [nearby, setNearby] = useState([]);
  const [claimsState, setMyClaims] = useState([]); // my claims on THIS item
  const myClaims = user ? claimsState : [];

  const pageKey = `${id}:${user?._id || ''}`;
  const loading = loadedKey !== pageKey;

  const loadItem = () =>
    getItem(id)
      .then((res) => {
        setItem(res.data.item);
        setActive(0);
      })
      .catch(() => setItem(null));

  const loadMyClaims = () => {
    if (!user) return;
    getMyClaims()
      .then((res) => setMyClaims(res.data.claims.filter((c) => c.item?._id === id)))
      .catch(() => {});
  };

  useEffect(() => {
    const key = pageKey;
    loadItem().finally(() => setLoadedKey(key));
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadMyClaims();
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Other open reports within 1 km of this item
  useEffect(() => {
    if (!item) return;
    const [lng, lat] = item.location.coordinates;
    getItems({ lat, lng, radius: 1, limit: 5, status: 'open' })
      .then((res) => setNearby(res.data.items.filter((i) => i._id !== item._id).slice(0, 4)))
      .catch(() => {});
  }, [item?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loader />;
  if (!item) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600">This item doesn't exist or was removed.</p>
        <Link to="/browse" className="mt-2 inline-block text-indigo-600 underline">Back to browse</Link>
      </div>
    );
  }

  const canManage = user && (user._id === item.postedBy?._id || user.role === 'admin');
  const [lng, lat] = item.location.coordinates;

  const activeClaim = myClaims.find((c) => ['pending', 'approved'].includes(c.status));
  const attemptsLeft = MAX_ATTEMPTS - myClaims.length;
  const lastRejected = myClaims.find((c) => c.status === 'rejected');

  const toggleReturned = async () => {
    const next = item.status === 'returned' ? 'open' : 'returned';
    try {
      const res = await updateItemStatus(item._id, next);
      setItem({ ...item, status: res.data.item.status });
      toast.success(next === 'returned' ? 'Marked as returned' : 'Item reopened');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await deleteItem(item._id);
      toast.success('Item deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const afterClaim = () => loadMyClaims();

  const openChat = async () => {
    try {
      const res = await startConversation(item._id);
      navigate(`/chats/${res.data.conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start chat');
    }
  };

  // ---------- the claim area (right column, bottom) ----------
  const renderClaimArea = () => {
    if (canManage) {
      return (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <Link to={`/items/${item._id}/edit`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Edit
            </Link>
            <Link to="/claims?tab=received" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Review claims
            </Link>
            <button onClick={toggleReturned} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
              {item.status === 'returned' ? 'Reopen' : 'Mark as returned'}
            </button>
            <button onClick={handleDelete} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
          {item.verificationQuestion && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Your verification question: <strong>{item.verificationQuestion}</strong>
            </p>
          )}
        </div>
      );
    }

    if (!user) {
      return (
        <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
          <Link to="/login" state={{ from: { pathname: `/items/${item._id}` } }} className="font-medium underline">
            Log in
          </Link>{' '}
          to {item.type === 'found' ? 'claim this item' : 'tell the owner you found it'}.
        </div>
      );
    }

    if (activeClaim) {
      const owner = activeClaim.itemOwner;
      return (
        <div className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Your claim</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${CLAIM_STYLES[activeClaim.status]}`}>
              {activeClaim.status}
            </span>
          </div>
          {activeClaim.status === 'pending' ? (
            <p className="text-sm text-slate-600">The poster is reviewing your claim. You'll find the result under Claims.</p>
          ) : (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <p className="font-medium">Approved! Contact {owner.name} to arrange the handover:</p>
              <p>Email: {owner.email}</p>
              {owner.phone && <p>Phone: {owner.phone}</p>}
            </div>
          )}
        </div>
      );
    }

    if (item.status !== 'open') {
      return (
        <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
          This item is {item.status}, so it is no longer accepting claims.
        </div>
      );
    }

    if (attemptsLeft <= 0) {
      return (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          You've used all your claim attempts for this item.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {lastRejected && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Your previous claim was rejected{lastRejected.ownerNote ? `: ${lastRejected.ownerNote}` : '.'}
          </p>
        )}
        <ClaimForm item={item} attemptsLeft={attemptsLeft} onSubmitted={afterClaim} />
      </div>
    );
  };

  return (
    <div className="grid gap-8 py-8 md:grid-cols-2">
      {/* Images */}
      <div>
        <div className="flex h-80 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          {item.images.length ? (
            <img src={item.images[active].url} alt={item.title} className="h-full w-full object-contain" />
          ) : (
            <span className="text-slate-400">No photo provided</span>
          )}
        </div>
        {item.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {item.images.map((img, i) => (
              <img
                key={img.publicId}
                src={img.url}
                alt=""
                onClick={() => setActive(i)}
                className={`h-16 w-16 cursor-pointer rounded-lg object-cover ${i === active ? 'ring-2 ring-indigo-500' : 'opacity-70'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${TYPE_STYLES[item.type]}`}>{item.type}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}>{item.status}</span>
        </div>

        <h1 className="text-3xl font-bold">{item.title}</h1>
        <p className="whitespace-pre-line text-slate-700">{item.description}</p>

        <dl className="space-y-1 text-sm">
          <div className="flex gap-2"><dt className="w-28 text-slate-500">Category</dt><dd>{item.category}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-slate-500">Date {item.type}</dt><dd>{formatDate(item.date)}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-slate-500">Place</dt><dd>{item.address || 'See map'}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-slate-500">Posted by</dt><dd>{item.postedBy?.name || 'Unknown'}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-slate-500">Posted on</dt><dd>{formatDate(item.createdAt)}</dd></div>
        </dl>

        {user && !canManage && (
          <button
            id="message-poster"
            onClick={openChat}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Message {item.postedBy?.name?.split(' ')[0] || 'poster'}
          </button>
        )}

        {renderClaimArea()}
      </div>

      {/* Suggested matches (poster/admin only) */}
      {canManage && (
        <div className="md:col-span-2">
          <MatchList key={item._id} item={item} />
        </div>
      )}

      {/* Map */}
      <div className="md:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Location</h2>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 underline"
          >
            Get directions
          </a>
        </div>
        <MapView position={[lat, lng]} />
      </div>

      {nearby.length > 0 && (
        <div className="md:col-span-2">
          <h2 className="mb-3 font-semibold">Other reports within 1 km</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((i) => <ItemCard key={i._id} item={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}