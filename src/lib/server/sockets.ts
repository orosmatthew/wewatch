import type { Server } from 'socket.io';

export function handleSocketsServer(io: Server) {
	io.on('connection', (socket) => {
		socket.emit('test');
	});
}
