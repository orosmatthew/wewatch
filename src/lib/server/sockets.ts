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
		socket.on('url', async (data: { videoId: string; room: string; time: number | null }) => {
			await db.room.update({
				where: { id: data.room },
				data: { videoId: data.videoId, playPauseTime: data.time ?? 0 }
			});
			io.to(data.room).emit('url', { videoId: data.videoId, time: data.time ?? 0 });
		});
		socket.on('play', async (data: { room: string; time: number }) => {
			socket.broadcast.to(data.room).emit('play');
			await db.room.update({
				where: { id: data.room },
				data: { isPlaying: true, playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('pause', async (data: { room: string; time: number }) => {
			socket.broadcast.to(data.room).emit('pause');
			await db.room.update({
				where: { id: data.room },
				data: { isPlaying: false, playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('seek', async (data: { room: string; time: number }) => {
			socket.broadcast.to(data.room).emit('seek', data.time);
			await db.room.update({
				where: { id: data.room },
				data: { playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('time', async (data: { room: string; time: number }) => {
			const room = await db.room.findUnique({
				where: { id: data.room }
			});
			if (!room) {
				return;
			}
			if (room.isPlaying === false) {
				socket.emit('seek', room.playPauseTime);
			} else if (room.playPauseAt) {
				const estimatedVideoTime =
					room.playPauseTime + (new Date().valueOf() - room.playPauseAt.valueOf()) / 1000;
				if (Math.abs(data.time - estimatedVideoTime) > 2) {
					socket.emit('seek', estimatedVideoTime);
				}
			}
		});
	});
}
