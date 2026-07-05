import { Server } from 'socket.io';

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*', // Allows cross-origin connection from Vite React frontend
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Listen for 'join' event to join a private user room (for notifications)
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId.toString());
                console.log(`Socket ${socket.id} joined private room: ${userId}`);
            }
        });

        // Join a listing's team group chat room
        socket.on('join_chat', (listingId) => {
            if (listingId) {
                const room = `chat_${listingId}`;
                socket.join(room);
                console.log(`Socket ${socket.id} joined chat room: ${room}`);
            }
        });

        // Leave a listing's team group chat room
        socket.on('leave_chat', (listingId) => {
            if (listingId) {
                const room = `chat_${listingId}`;
                socket.leave(room);
                console.log(`Socket ${socket.id} left chat room: ${room}`);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export default socketHandler;
