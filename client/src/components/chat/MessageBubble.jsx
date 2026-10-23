const timeOf = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function MessageBubble({ message, mine, seen }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          mine ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-white text-slate-800'
        } ${message.pending ? 'opacity-60' : ''}`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`mt-1 text-right text-[10px] ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>
          {timeOf(message.createdAt)}
          {mine && (message.pending ? ' · sending' : seen ? ' · seen' : ' · sent')}
        </p>
      </div>
    </div>
  );
}
