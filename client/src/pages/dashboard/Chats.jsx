import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ChatWindow from '../../components/chat/ChatWindow';
import { useSocket } from '../../context/SocketContext';
import useAuth from '../../hooks/useAuth';
import { getConversations } from '../../services/chatService';

const when = (d) => {
  const date = new Date(d);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function Chats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      getConversations()
        .then((res) => setConversations(res.data.conversations))
        .catch(() => {})
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // keep the list fresh when messages arrive in any thread
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('chat:message', load);
    return () => socket.off('chat:message', load);
  }, [socket, load]);

  return (
    <div className="py-6">
      <h1 className="mb-4 text-2xl font-bold">Messages</h1>
      <div className="flex h-[70vh] overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* conversation list */}
        <aside className={`w-full shrink-0 overflow-y-auto border-r md:w-80 ${id ? 'hidden md:block' : ''}`}>
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading…</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No conversations yet. Open any item and press <strong>Message</strong> to contact the poster.
              <Link to="/browse" className="mt-2 block text-indigo-600 underline">Browse items</Link>
            </div>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c._id}>
                  <button
                    onClick={() => navigate(`/chats/${c._id}`)}
                    className={`flex w-full gap-3 border-b px-4 py-3 text-left hover:bg-slate-50 ${c._id === id ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                        {c.otherUser?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {c.otherUser?.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{c.otherUser?.name || 'Unknown'}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{when(c.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">Re: {c.item?.title || 'deleted item'}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${c.unread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                          {c.lastMessage
                            ? `${c.lastSender === user._id ? 'You: ' : ''}${c.lastMessage}`
                            : 'No messages yet'}
                        </p>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* active chat */}
        <section className={`min-w-0 flex-1 flex-col ${id ? 'flex' : 'hidden md:flex'}`}>
          {id ? (
            <>
              <button onClick={() => navigate('/chats')} className="border-b px-4 py-2 text-left text-sm text-indigo-600 md:hidden">
                ← All chats
              </button>
              <ChatWindow key={id} conversationId={id} onActivity={load} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
