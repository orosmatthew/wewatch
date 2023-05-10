import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const roomId = params.roomId;
	const room = await db.room.findUnique({ where: { id: roomId } });
	if (!room) {
		throw redirect(302, '/');
	}
}) satisfies PageServerLoad;
