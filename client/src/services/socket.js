import io from 'socket.io-client';

// Use VITE_API_URL from environment, fallback to localhost for development
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(URL);