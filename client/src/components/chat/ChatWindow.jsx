import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { getMessages, markConversationRead, sendMessage } from '../../services/chatService';
import { TYPE_STYLES } from '../../utils/helpers';

// Parent passes key={conversationId}, so this component remounts per conversation
export default function ChatWindow({ conversationId, onActivity }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [seenAt, setSeenAt] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // initial load
  useEffect(() => {
    getMessages(conversationId)
      .then((res) => {
        setConvo(res.data.conversation);
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
        onActivity?.();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not open chat'))
      .finally(() => setLoading(false));
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // live events
  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = ({ conversationId: cid, message }) => {
      if (cid !== conversationId) return;
      setMessages((list) => (list.some((m) => m._id === message._id) ? list : [...list, message]));
      if (message.sender !== user._id) {
        setOtherTyping(false);
        markConversationRead(conversationId).then(() => onActivity?.()).catch(() => {});
      }
    };
    const onTyping = ({ conversationId: cid, typing }) => cid === conversationId && setOtherTyping(typing);
    const onRead = ({ conversationId: cid, readAt }) => cid === conversationId && setSeenAt(readAt);

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
    };
  }, [socket, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, otherTyping]);

  const loadOlder = async () => {
    if (!messages.length) return;
    try {
      const res = await getMessages(conversationId, messages[0].createdAt);
      setMessages((list) => [...res.data.messages, ...list]);
      setHasMore(res.data.hasMore);
    } catch {
      toast.error('Could not load older messages');
    }
  };

  const emitTyping = (typing) => socket?.emit('chat:typing', { conversationId, typing });

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    clearTimeout(typingTimer.current);
    emitTyping(false);

    // optimistic bubble, replaced by the real message once saved
    const tempId = `temp-${Date.now()}`;
    setMessages((list) => [...list, { _id: tempId, text: body, sender: user._id, createdAt: new Date().toISOString(), pending: true }]);
    try {
      const res = await sendMessage(conversationId, body);
      const saved = res.data.message;
      setMessages((list) => {
        const withoutTemp = list.filter((m) => m._id !== tempId);
        return withoutTemp.some((m) => m._id === saved._id) ? withoutTemp : [...withoutTemp, saved];
      });
      setSeenAt(null);
      onActivity?.();
    } catch (err) {
      setMessages((list) => list.filter((m) => m._id !== tempId));
      setText(body);
      toast.error(err.response?.data?.message || 'Message not sent');
    }
  };

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading chat…</div>;
  if (!convo) return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Chat not available.</div>;

  // "seen" on my latest message if the other side read after it was sent
  const myLast = [...messages].reverse().find((m) => m.sender === user._id && !m.pending);
  const lastSeen = myLast && (seenAt ? new Date(seenAt) >= new Date(myLast.createdAt) : Boolean(myLast.readAt));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
          {convo.otherUser?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{convo.otherUser?.name || 'Unknown user'}</p>
          <p className="truncate text-xs text-slate-500">
            {otherTyping ? <span className="text-indigo-600">typing…</span> : convo.otherUser?.online ? 'online' : 'offline'}
          </p>
        </div>
        {convo.item && (
          <Link to={`/items/${convo.item._id}`} className="flex max-w-[45%] items-center gap-2 rounded-lg border px-2 py-1 text-xs hover:bg-slate-50">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_STYLES[convo.item.type]}`}>
              {convo.item.type}
            </span>
            <span className="truncate">{convo.item.title}</span>
          </Link>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-4">
        {hasMore && (
          <div className="text-center">
            <button onClick={loadOlder} className="text-xs text-indigo-600 hover:underline">Load older messages</button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Say hello 👋 Share details that help confirm the item, but don't post sensitive info like card numbers.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m._id} message={m} mine={m.sender === user._id} seen={m === myLast && lastSeen} />
        ))}
        {otherTyping && <p className="text-xs italic text-slate-400">{convo.otherUser?.name} is typing…</p>}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form onSubmit={handleSend} className="flex gap-2 border-t bg-white p-3">
        <input
          id="chat-input"
          value={text}
          onChange={handleChange}
          maxLength={2000}
          placeholder="Type a message…"
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-indigo-500"
          autoComplete="off"
        />
        <button
          id="chat-send"
          type="submit"
          disabled={!text.trim()}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
