import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const roomId = params.roomId;
	const room = await db.room.findUnique({ where: { id: roomId } });
	if (!room) {
		throw redirect(302, '/');
	}
	const messages = await db.message.findMany({ where: { roomId: roomId } });
	return {
		videoId: room.videoId,
		messages: messages.map((message) => {
			return { createdAt: message.createdAt, value: message.value };
		}),
		videoTime: (() => {
			if (room.isPlaying && room.playPauseAt) {
				return room.playPauseTime + (new Date().valueOf() - room.playPauseAt.valueOf()) / 1000;
			} else {
				return room.playPauseTime;
			}
		})()
	};
}) satisfies PageServerLoad;
