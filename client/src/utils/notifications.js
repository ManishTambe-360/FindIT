// Shared look for each notification type (icon + colour)
export const NOTIFICATION_META = {
  match: { icon: '🔍', color: 'bg-indigo-100 text-indigo-700', label: 'Match' },
  claim_new: { icon: '📩', color: 'bg-amber-100 text-amber-700', label: 'New claim' },
  claim_approved: { icon: '✅', color: 'bg-green-100 text-green-700', label: 'Approved' },
  claim_rejected: { icon: '❌', color: 'bg-red-100 text-red-700', label: 'Rejected' },
  claim_withdrawn: { icon: '↩️', color: 'bg-slate-200 text-slate-600', label: 'Withdrawn' },
  message: { icon: '💬', color: 'bg-sky-100 text-sky-700', label: 'Message' },
};

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
