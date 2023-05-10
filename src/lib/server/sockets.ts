import type { Server } from 'socket.io';
import { db } from './prisma';

export function handleSocketsServer(io: Server) {
	io.on('connection', (socket) => {
		socket.on('join', async (roomId: string) => {
			const room = await db.room.findUnique({ where: { id: roomId } });
			if (room) {
				await socket.join(roomId);
			}
		});
		socket.on('sendMessage', async (message: { room: string; value: string }) => {
			await db.message.create({ data: { value: message.value, roomId: message.room } });
			io.to(message.room).emit('recvMessage', message.value);
		});
	});
}
