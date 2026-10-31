import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ItemForm from '../components/items/ItemForm';
import Loader from '../components/common/Loader';
import useAuth from '../hooks/useAuth';
import { createItem, getItem, updateItem } from '../services/itemService';

// Create (/report?type=lost|found) or edit (/items/:id/edit) an item.
// All form UI lives in <ItemForm>; this page only loads and saves.
export default function ReportItem() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loaded, setLoaded] = useState(null); // { initial, position, images } when editing
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getItem(id)
      .then((res) => {
        const it = res.data.item;
        if (it.postedBy?._id !== user._id && user.role !== 'admin') {
          toast.error('You can only edit your own items');
          navigate('/dashboard');
          return;
        }
        setLoaded({
          initial: {
            type: it.type,
            title: it.title,
            category: it.category,
            description: it.description,
            date: it.date.slice(0, 10),
            address: it.address || '',
            verificationQuestion: it.verificationQuestion || '',
            verificationAnswer: '', // blank = keep existing answer
          },
          position: { lat: it.location.coordinates[1], lng: it.location.coordinates[0] },
          images: it.images || [],
        });
      })
      .catch(() => {
        toast.error('Item not found');
        navigate('/dashboard');
      });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (fd) => {
    setSubmitting(true);
    try {
      const res = isEdit ? await updateItem(id, fd) : await createItem(fd);
      toast.success(isEdit ? 'Item updated' : 'Item reported! We\'ll look for matches.');
      navigate(`/items/${res.data.item._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && !loaded) return <Loader label="Loading item…" />;

  const startType = searchParams.get('type') === 'found' ? 'found' : 'lost';

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6">
        {isEdit && (
          <Link to={`/items/${id}`} className="text-sm text-indigo-600 hover:underline">← Back to item</Link>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{isEdit ? 'Edit report' : 'Report an item'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Changes are re-checked for new matches when you save.'
            : 'It takes about a minute. We\'ll automatically look for matching reports nearby.'}
        </p>
      </div>

      <ItemForm
        key={isEdit ? id : startType}
        initial={isEdit ? loaded.initial : { type: startType }}
        initialPosition={isEdit ? loaded.position : null}
        initialImages={isEdit ? loaded.images : []}
        isEdit={isEdit}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}