import type { Server } from 'socket.io';
import { db } from './prisma';

export function handleSocketsServer(io: Server) {
	io.on('connection', (socket) => {
		socket.on('start', async (roomId: string) => {
			const room = await db.room.findUnique({ where: { id: roomId } });
			if (!room) {
				return;
			}
			await socket.join(roomId);
			socket.data.roomId = roomId;
		});
		socket.on('join', async (username: string, callback) => {
			if (!socket.data.roomId || username === '') {
				callback({
					success: false
				});
				return;
			}
			try {
				await db.user.create({ data: { username: username.trim(), roomId: socket.data.roomId } });
			} catch {
				callback({
					success: false
				});
				return;
			}
			socket.data.username = username.trim();
			callback({
				success: true
			});
			io.to(socket.data.roomId).emit('join', username.trim());
		});
		socket.on('message', async (message: { username: string; value: string }) => {
			if (!socket.data.roomId || !socket.data.username) {
				return;
			}
			await db.message.create({
				data: { username: message.username, value: message.value, roomId: socket.data.roomId }
			});
			io.to(socket.data.roomId).emit('message', {
				username: message.username,
				value: message.value
			});
		});
		socket.on('url', async (data: { videoId: string; time: number | null }) => {
			if (!socket.data.roomId) {
				return;
			}
			await db.room.update({
				where: { id: socket.data.roomId },
				data: { videoId: data.videoId, playPauseTime: data.time ?? 0 }
			});
			io.to(socket.data.roomId).emit('url', { videoId: data.videoId, time: data.time ?? 0 });
		});
		socket.on('play', async (data: { time: number }) => {
			if (!socket.data.roomId) {
				return;
			}
			socket.broadcast.to(socket.data.roomId).emit('play');
			await db.room.update({
				where: { id: socket.data.roomId },
				data: { isPlaying: true, playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('pause', async (data: { time: number }) => {
			if (!socket.data.roomId) {
				return;
			}
			socket.broadcast.to(socket.data.roomId).emit('pause');
			await db.room.update({
				where: { id: socket.data.roomId },
				data: { isPlaying: false, playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('seek', async (data: { time: number }) => {
			if (!socket.data.roomId) {
				return;
			}
			socket.broadcast.to(socket.data.roomId).emit('seek', data.time);
			await db.room.update({
				where: { id: socket.data.roomId },
				data: { playPauseTime: Math.round(data.time), playPauseAt: new Date() }
			});
		});
		socket.on('time', async (data: { time: number; isPlaying: boolean }) => {
			if (!socket.data.roomId) {
				return;
			}
			const room = await db.room.findUnique({
				where: { id: socket.data.roomId }
			});
			if (!room) {
				return;
			}
			if (room.isPlaying && !data.isPlaying) {
				socket.emit('play');
			} else if (!room.isPlaying && data.isPlaying) {
				socket.emit('pause');
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
		socket.on('disconnect', async () => {
			if (socket.data.roomId && socket.data.username) {
				io.to(socket.data.roomId).emit('leave', socket.data.username);
				try {
					const user = await db.user.delete({
						where: {
							roomId_username: { roomId: socket.data.roomId, username: socket.data.username }
						}
					});
					const room = await db.room.findUnique({
						where: { id: user.roomId },
						include: { users: true }
					});
					if (room) {
						if (room.users.length === 0) {
							await db.message.deleteMany({ where: { roomId: room.id } });
							await db.room.delete({ where: { id: room.id } });
						}
					}
				} catch (e) {
					console.error(e);
				}
			}
		});
	});
}
