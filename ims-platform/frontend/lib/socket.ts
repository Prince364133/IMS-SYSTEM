import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : null;
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
            auth: { token },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            transports: ['websocket'],
        });

        socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
        socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
        socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
