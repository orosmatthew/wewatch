import { socketUrl } from '../hooks.server';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {
	return { socketUrl: socketUrl() };
}) satisfies LayoutServerLoad;
