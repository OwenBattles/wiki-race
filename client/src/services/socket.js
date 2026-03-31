import io from 'socket.io-client';

// Prefer explicit backend URL, otherwise use same-origin in production.
const URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const socket = io(URL);