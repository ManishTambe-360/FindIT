import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

const SocketContext = createContext(null);

// Socket.io lives on the same host as the API, without the /api suffix
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    const s = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('findit_token') },
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => setSocket(s));
    s.on('connect_error', (err) => console.warn('Socket error:', err.message));
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Returns the connected socket, or null when logged out / not yet connected
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
