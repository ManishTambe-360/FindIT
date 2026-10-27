// <Loader />                     centered spinner for page loads
// <Loader label="Loading…" />    with a caption
// <Loader size="sm" inline />    small spinner inside buttons / rows
export default function Loader({ label, size = 'md', inline = false }) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : 'h-10 w-10 border-4';
  const spinner = (
    <span
      role="status"
      aria-label={label || 'Loading'}
      className={`inline-block animate-spin rounded-full border-indigo-200 border-t-indigo-600 ${dims}`}
    />
  );
  if (inline) return spinner;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      {spinner}
      {label && <p className="animate-pulse text-sm text-slate-500">{label}</p>}
    </div>
  );
}