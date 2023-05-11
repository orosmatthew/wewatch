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
		socket.on('message', async (message: { room: string; value: string }) => {
			await db.message.create({ data: { value: message.value, roomId: message.room } });
			io.to(message.room).emit('message', message.value);
		});
		socket.on('url', async (data: { videoId: string; room: string }) => {
			await db.room.update({ where: { id: data.room }, data: { videoId: data.videoId } });
			io.to(data.room).emit('url', data.videoId);
		});
		socket.on('play', async (data: { room: string }) => {
			socket.broadcast.to(data.room).emit('play');
			await db.room.update({
				where: { id: data.room },
				data: { isPlaying: true, startedPlaying: new Date() }
			});
		});
		socket.on('pause', async (data: { room: string }) => {
			socket.broadcast.to(data.room).emit('pause');
			await db.room.update({ where: { id: data.room }, data: { isPlaying: false } });
		});
		socket.on('seek', async (data: { room: string; time: number }) => {
			socket.broadcast.to(data.room).emit('seek', data.time);
			await db.room.update({
				where: { id: data.room },
				data: { timeSeconds: Math.round(data.time) }
			});
		});
		// socket.on('time', async (data: { room: string; time: number }) => {
		// 	const room = await db.room.findUnique({
		// 		where: { id: data.room },
		// 		select: { startedPlaying: true, timeSeconds: true }
		// 	});
		// 	if (!room) {
		// 		return;
		// 	}
		// 	if (data.time < room.timeSeconds) {
		// 		await db.room.update({
		// 			where: { id: data.room },
		// 			data: { timeSeconds: Math.round(data.time) }
		// 		});
		// 	} else if (data.time > room.timeSeconds + 5) {
		// 		socket.emit('seek', room.timeSeconds);
		// 	}
		// });
	});
}
