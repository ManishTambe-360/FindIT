import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../components/map/LocationPicker';
import Loader from '../components/common/Loader';
import useAuth from '../hooks/useAuth';
import { createItem, getItem, updateItem } from '../services/itemService';
import { CATEGORIES, todayISO } from '../utils/helpers';

const MAX_IMAGES = 4;

export default function ReportItem() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    type: searchParams.get('type') === 'found' ? 'found' : 'lost',
    title: '',
    category: CATEGORIES[0],
    description: '',
    date: todayISO(),
    address: '',
    verificationQuestion: '',
    verificationAnswer: '',
  });
  const [position, setPosition] = useState(null);
  const [existing, setExisting] = useState([]); // images already saved (kept)
  const [removed, setRemoved] = useState([]);   // publicIds to delete
  const [files, setFiles] = useState([]);       // newly picked files
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Load item when editing
  useEffect(() => {
    if (!isEdit) return;
    getItem(id)
      .then((res) => {
        const it = res.data.item;
        if (it.postedBy?._id !== user._id && user.role !== 'admin') {
          toast.error('You can only edit your own items');
          return navigate('/dashboard');
        }
        setForm({
          type: it.type,
          title: it.title,
          category: it.category,
          description: it.description,
          date: it.date.slice(0, 10),
          address: it.address || '',
          verificationQuestion: it.verificationQuestion || '',
          verificationAnswer: '', // blank = keep existing answer
        });
        setPosition({ lat: it.location.coordinates[1], lng: it.location.coordinates[0] });
        setExisting(it.images || []);
      })
      .catch(() => {
        toast.error('Item not found');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preview URLs for newly picked files
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (e) => {
    const picked = [...e.target.files];
    if (existing.length + files.length + picked.length > MAX_IMAGES) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
    } else {
      setFiles([...files, ...picked]);
    }
    e.target.value = '';
  };

  const removeExisting = (img) => {
    setExisting(existing.filter((i) => i.publicId !== img.publicId));
    setRemoved([...removed, img.publicId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return toast.error('Please pick the location on the map');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('lat', position.lat);
    fd.append('lng', position.lng);
    files.forEach((f) => fd.append('images', f));
    if (isEdit) fd.append('removeImages', JSON.stringify(removed));

    setSubmitting(true);
    try {
      const res = isEdit ? await updateItem(id, fd) : await createItem(fd);
      toast.success(isEdit ? 'Item updated' : 'Item reported');
      navigate(`/items/${res.data.item._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const field = 'w-full rounded-lg border bg-white px-3 py-2 focus:outline-indigo-500';
  const label = 'mb-1 block text-sm font-medium';

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {isEdit ? 'Edit item' : form.type === 'lost' ? 'Report a lost item' : 'Report a found item'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow">
        {/* Type */}
        {!isEdit && (
          <div className="flex gap-3">
            {['lost', 'found'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 rounded-lg border py-2 font-medium capitalize ${
                  form.type === t
                    ? t === 'lost' ? 'border-red-500 bg-red-50 text-red-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-50'
                }`}
              >
                I {t === 'lost' ? 'lost' : 'found'} something
              </button>
            ))}
          </div>
        )}

        <div>
          <label className={label}>Title</label>
          <input name="title" required maxLength={100} value={form.title} onChange={handleChange} placeholder="e.g. Black leather wallet" className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={field}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Date {form.type === 'lost' ? 'lost' : 'found'}</label>
            <input type="date" name="date" required max={todayISO()} value={form.date} onChange={handleChange} className={field} />
          </div>
        </div>

        <div>
          <label className={label}>Description</label>
          <textarea
            name="description" required rows={4} maxLength={1000}
            value={form.description} onChange={handleChange}
            placeholder="Colour, brand, size, distinguishing marks..."
            className={field}
          />
        </div>

        <div>
          <label className={label}>Photos (up to {MAX_IMAGES}, max 5 MB each)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFiles} className="text-sm" />
          <div className="mt-3 flex flex-wrap gap-3">
            {existing.map((img) => (
              <div key={img.publicId} className="relative">
                <img src={img.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button type="button" onClick={() => removeExisting(img)} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs text-white">×</button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={src} className="relative">
                <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover ring-2 ring-indigo-300" />
                <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs text-white">×</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>Where? (landmark or address, optional)</label>
          <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Near canteen, Block B" className={field} />
        </div>

        <div>
          <label className={label}>Pin the exact location</label>
          <LocationPicker value={position} onChange={setPosition} />
        </div>

        {form.type === 'found' && (
          <div className="space-y-3 rounded-lg bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Ownership verification (optional but recommended)
            </p>
            <p className="text-xs text-amber-700">
              Ask a question only the real owner can answer. They must answer it before they can claim the item.
            </p>
            <input
              name="verificationQuestion" value={form.verificationQuestion} onChange={handleChange}
              placeholder="e.g. What is the wallpaper on the phone?" className={field}
            />
            <input
              name="verificationAnswer" value={form.verificationAnswer} onChange={handleChange}
              placeholder={isEdit ? 'Leave blank to keep the current answer' : 'Correct answer'} className={field}
            />
          </div>
        )}

        <button
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}