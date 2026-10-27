// Prev / Next pagination used by the admin tables
export default function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">
        ← Prev
      </button>
      <span className="text-slate-500">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">
        Next →
      </button>
    </div>
  );
}
