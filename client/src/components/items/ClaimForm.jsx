import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitClaim } from '../../services/claimService';

export default function ClaimForm({ item, attemptsLeft, onSubmitted }) {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFound = item.type === 'found';
  const hasQuestion = Boolean(item.verificationQuestion);
  const field = 'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-indigo-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitClaim(item._id, { message, answer });
      toast.success('Claim submitted! The poster will review it.');
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <h2 className="font-semibold text-indigo-900">
        {isFound ? 'Is this yours? Claim it' : 'Did you find this? Let the owner know'}
      </h2>

      {hasQuestion && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Verification question</p>
          <p className="rounded-lg bg-white px-3 py-2 text-sm">{item.verificationQuestion}</p>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer"
            required
            className={field}
          />
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={3}
        maxLength={500}
        placeholder={
          isFound
            ? 'Describe the item: marks, contents, when and where you lost it...'
            : 'Where did you find it? Where can you hand it over?'
        }
        className={field}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left. Contact details are shared only after approval.
        </span>
        <button
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit claim'}
        </button>
      </div>
    </form>
  );
}