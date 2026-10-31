import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import LocationPicker from '../map/LocationPicker';
import { CATEGORIES, todayISO } from '../../utils/helpers';

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

const EMPTY_ITEM = {
  type: 'lost',
  title: '',
  category: CATEGORIES[0],
  description: '',
  date: '',
  address: '',
  verificationQuestion: '',
  verificationAnswer: '',
};

const field =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

function Section({ step, title, hint, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4 sm:pl-10">{children}</div>
    </section>
  );
}

const Counter = ({ value, max }) => (
  <span className={`text-[11px] ${value.length > max * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
    {value.length}/{max}
  </span>
);

/**
 * Lost/found item form, used for both creating and editing.
 *
 * Props:
 *  - initial:        starting values; anything missing falls back to an empty lost report dated today
 *  - initialPosition { lat, lng } | null
 *  - initialImages   [{ url, publicId }] already saved on the item
 *  - isEdit          hides the type switch, changes button text
 *  - submitting      disables the submit button
 *  - onSubmit(FormData) called with a ready-to-send multipart body
 */
export default function ItemForm({
  initial = {},
  initialPosition = null,
  initialImages = [],
  isEdit = false,
  submitting = false,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY_ITEM, date: todayISO(), ...initial }));
  const [position, setPosition] = useState(initialPosition);
  const [existing, setExisting] = useState(initialImages); // saved images being kept
  const [removed, setRemoved] = useState([]); // publicIds to delete on save
  const [files, setFiles] = useState([]); // newly picked files
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInput = useRef(null);

  // Preview URLs for newly picked files (revoked when they change)
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const handleChange = (e) => set(e.target.name, e.target.value);

  const addFiles = (list) => {
    const picked = [...list];
    const bad = picked.find((f) => !ACCEPTED.includes(f.type));
    if (bad) return toast.error(`"${bad.name}" is not a PNG, JPG or WEBP image`);
    const big = picked.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (big) return toast.error(`"${big.name}" is larger than ${MAX_SIZE_MB} MB`);
    if (existing.length + files.length + picked.length > MAX_IMAGES) {
      return toast.error(`You can add up to ${MAX_IMAGES} photos`);
    }
    setFiles((f) => [...f, ...picked]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeExisting = (img) => {
    setExisting((list) => list.filter((i) => i.publicId !== img.publicId));
    setRemoved((list) => [...list, img.publicId]);
  };

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Give it a short, specific title (at least 3 characters)';
    if (form.description.trim().length < 10) e.description = 'Add a few details (at least 10 characters)';
    if (!form.date) e.date = 'Pick a date';
    if (!position) e.position = 'Click on the map to pin where it happened';
    if (form.type === 'found' && form.verificationQuestion.trim() && !form.verificationAnswer.trim() && !isEdit) {
      e.verificationAnswer = 'Add the answer to your question';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v.trim() : v));
    fd.append('lat', position.lat);
    fd.append('lng', position.lng);
    files.forEach((f) => fd.append('images', f));
    if (isEdit) fd.append('removeImages', JSON.stringify(removed));
    onSubmit(fd);
  };

  const isLost = form.type === 'lost';
  const photoCount = existing.length + files.length;
  const err = (name) => errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>;
  const errBorder = (name) => (errors[name] ? ' border-red-400 focus:border-red-500 focus:ring-red-100' : '');

  return (
    <form id="item-form" onSubmit={handleSubmit} noValidate className="space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      {/* Type switch */}
      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          {['lost', 'found'].map((t) => {
            const active = form.type === t;
            const tone = t === 'lost'
              ? 'border-rose-500 bg-rose-50 text-rose-700'
              : 'border-emerald-500 bg-emerald-50 text-emerald-700';
            return (
              <button
                key={t}
                id={`type-${t}`}
                type="button"
                onClick={() => set('type', t)}
                className={`rounded-xl border-2 px-4 py-3 text-left transition ${active ? tone : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="text-xl">{t === 'lost' ? '😟' : '🙌'}</span>
                <p className="mt-1 font-semibold">I {t} something</p>
                <p className="text-xs opacity-75">{t === 'lost' ? 'Help others spot it' : 'Help it get home'}</p>
              </button>
            );
          })}
        </div>
      )}

      <Section step={1} title="What is it?" hint="Specific details make matching much more accurate.">
        <div>
          <div className="flex items-end justify-between">
            <label htmlFor="title" className={labelCls}>Title</label>
            <Counter value={form.title} max={100} />
          </div>
          <input
            id="title" name="title" maxLength={100} value={form.title} onChange={handleChange}
            placeholder={isLost ? 'e.g. Black leather wallet' : 'e.g. Blue water bottle with stickers'}
            className={field + errBorder('title')}
          />
          {err('title')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelCls}>Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} className={field}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="date" className={labelCls}>Date {form.type}</label>
            <input
              id="date" type="date" name="date" max={todayISO()} value={form.date} onChange={handleChange}
              className={field + errBorder('date')}
            />
            {err('date')}
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <label htmlFor="description" className={labelCls}>Description</label>
            <Counter value={form.description} max={1000} />
          </div>
          <textarea
            id="description" name="description" rows={4} maxLength={1000}
            value={form.description} onChange={handleChange}
            placeholder="Colour, brand, size, stickers, scratches, what was inside…"
            className={field + errBorder('description')}
          />
          {err('description')}
          {!isLost && (
            <p className="mt-1 text-xs text-slate-500">
              Tip: leave out one identifying detail so you can check the real owner knows it.
            </p>
          )}
        </div>
      </Section>

      <Section step={2} title="Photos" hint={`Optional · up to ${MAX_IMAGES} · PNG, JPG or WEBP · max ${MAX_SIZE_MB} MB each`}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => photoCount < MAX_IMAGES && fileInput.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          } ${photoCount >= MAX_IMAGES ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className="text-2xl">📷</span>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {photoCount >= MAX_IMAGES ? 'Photo limit reached' : 'Drop photos here or click to browse'}
          </p>
          <p className="text-xs text-slate-500">{photoCount}/{MAX_IMAGES} added</p>
          <input
            ref={fileInput} id="photos" type="file" accept={ACCEPTED.join(',')} multiple hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {photoCount > 0 && (
          <div className="flex flex-wrap gap-3">
            {existing.map((img) => (
              <div key={img.publicId} className="group relative">
                <img src={img.url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button" onClick={() => removeExisting(img)} title="Remove"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow"
                >
                  ×
                </button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={src} className="relative">
                <img src={src} alt="" className="h-24 w-24 rounded-lg object-cover ring-2 ring-indigo-300" />
                <span className="absolute bottom-1 left-1 rounded bg-indigo-600 px-1 text-[10px] text-white">new</span>
                <button
                  type="button" title="Remove"
                  onClick={() => setFiles((list) => list.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section step={3} title="Where?" hint={`Pin the spot where you ${form.type} it, as precisely as you can.`}>
        <div>
          <label htmlFor="address" className={labelCls}>Landmark or address <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            id="address" name="address" value={form.address} onChange={handleChange}
            placeholder="e.g. Near canteen, Block B" className={field}
          />
        </div>
        <div className={errors.position ? 'rounded-lg ring-2 ring-red-300' : ''}>
          <LocationPicker
            value={position}
            onChange={(p) => {
              setPosition(p);
              if (errors.position) setErrors((e) => ({ ...e, position: undefined }));
            }}
          />
        </div>
        {err('position')}
      </Section>

      {form.type === 'found' && (
        <Section step={4} title="Ownership check" hint="Optional, but strongly recommended for valuables.">
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-800">
              Ask something only the real owner would know. Claimants must answer it, and only you see their answer.
            </p>
            <input
              id="verificationQuestion" name="verificationQuestion" value={form.verificationQuestion} onChange={handleChange}
              placeholder="e.g. What is the phone's lock screen wallpaper?" className={field}
            />
            <input
              id="verificationAnswer" name="verificationAnswer" value={form.verificationAnswer} onChange={handleChange}
              placeholder={isEdit ? 'Leave blank to keep the current answer' : 'Correct answer (kept private)'}
              className={field + errBorder('verificationAnswer')}
            />
            {err('verificationAnswer')}
          </div>
        </Section>
      )}

      <button
        id="item-submit"
        disabled={submitting}
        className={`w-full rounded-xl py-3 font-semibold text-white shadow-sm transition disabled:opacity-60 ${
          isEdit ? 'bg-indigo-600 hover:bg-indigo-700' : isLost ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {submitting ? 'Saving…' : isEdit ? 'Save changes' : isLost ? 'Report lost item' : 'Report found item'}
      </button>
    </form>
  );
}
