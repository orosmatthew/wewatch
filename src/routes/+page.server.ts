import type { Room } from '@prisma/client';
import type { Actions } from './$types';
import { db } from '$lib/server/prisma';
import { generateRoomId } from '$lib/util';
import { redirect } from '@sveltejs/kit';

export const actions = {
	create: async () => {
		let createdRoom: Room | undefined;
		for (let i = 0; i < 100; i++) {
			const roomId = generateRoomId();
			try {
				createdRoom = await db.room.create({ data: { id: roomId, videoId: 'mN0zPOpADL4' } });
				break;
			} catch {
				continue;
			}
		}
		if (!createdRoom) {
			return { success: false, message: 'Unable to create room' };
		}
		throw redirect(302, `/room/${createdRoom.id}`);
	}
} satisfies Actions;
