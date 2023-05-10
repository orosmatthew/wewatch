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
		socket.on('play', async (data: { videoId: string; room: string }) => {
			await db.room.update({ where: { id: data.room }, data: { videoId: data.videoId } });
			io.to(data.room).emit('play', data.videoId);
		});
	});
}
