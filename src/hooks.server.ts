import { Server as SocketServer } from 'socket.io';
import * as dotenv from 'dotenv';
import { handleSocketsServer } from '$lib/server/sockets';
import portfinder from 'portfinder';
import { dev } from '$app/environment';
import { db } from '$lib/server/prisma';

dotenv.config();

let socketPort: number;
if (dev) {
	socketPort = await portfinder.getPortPromise();
} else {
	if (!process.env.SOCKET_PORT || isNaN(parseInt(process.env.SOCKET_PORT))) {
		throw Error('SOCKET_PORT missing or invalid in env');
	} else {
		socketPort = parseInt(process.env.SOCKET_PORT);
	}
	await db.user.deleteMany();
	await db.message.deleteMany();
	await db.room.deleteMany();
}

export function socketUrl(): string {
	if (dev) {
		return `ws://localhost:${socketPort}`;
	} else {
		if (!process.env.SOCKET_URL) {
			throw Error('SOCKET_URL not defiend in env');
		} else {
			return process.env.SOCKET_URL;
		}
	}
}

const io = new SocketServer(socketPort, { cors: { origin: '*' } });

handleSocketsServer(io);

console.log(`Websockets listening on port ${socketPort}`);
