// Empty string = relative URLs → handled by Vite proxy → forwarded to backend on port 5000
// Do NOT set an absolute http://localhost:XXXX here or it bypasses the proxy
export const API_URL = import.meta.env.VITE_API_URL || '';

// For socket.io, connect to the same origin so the Vite proxy handles it
export const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;