// Use production backend URL directly
export const API_URL = import.meta.env.VITE_API_URL || 'https://cofound-backend-rcrs.onrender.com';

// For socket.io, connect to the production backend URL
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://cofound-backend-rcrs.onrender.com';