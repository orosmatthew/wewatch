<script lang="ts">
	import { browser } from '$app/environment';
	import { Socket, io } from 'socket.io-client';
	import { socketUrl } from '../../+layout.svelte';
	import { defineCustomElements } from '@vime/core';
	import '@vime/core/themes/default.css';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { onDestroy, onMount } from 'svelte';

	export let data: PageData;

	let chats: string[] = [];

	data.messages
		.sort((a, b) => {
			return a.createdAt.valueOf() - b.createdAt.valueOf();
		})
		.forEach((message) => {
			chats.push(message.value);
		});

	let username: string | null = null;
	let socket: Socket | undefined;
	let vmPlayer: HTMLVmPlayerElement;
	if (browser) {
		username = localStorage.getItem('username');
		defineCustomElements();
		socket = io($socketUrl);
		if ($page.params.roomId) {
			socket.emit('join', $page.params.roomId);
		}
		socket.on('message', (message) => {
			chats.push(message);
			chats = chats;
		});
		socket.on('url', (videoId: string) => {
			playYoutube(videoId);
		});
		socket.on('play', () => {
			vmPlayer.play();
		});
		socket.on('pause', () => {
			vmPlayer.pause();
		});
		socket.on('seek', (time) => {
			vmPlayer.currentTime = time;
		});
	}

	function playYoutube(id: string) {
		const vmPlayer = document.querySelector('vm-player') as HTMLVmPlayerElement;
		const vmYoutube = document.querySelector('vm-youtube') as HTMLVmYoutubeElement;
		vmPlayer.removeChild(vmYoutube);
		const newVmYoutube = document.createElement('vm-youtube');
		newVmYoutube.videoId = id;
		vmPlayer.appendChild(newVmYoutube);
	}

	function onPlayUrl() {
		const urlInput = document.getElementById('vid_url') as HTMLInputElement | undefined;
		if (!urlInput) {
			return;
		}
		const url = new URL(urlInput.value);
		if (
			url.hostname === 'youtube.com' ||
			url.hostname === 'www.youtube.com' ||
			url.hostname === 'm.youtube.com'
		) {
			const params = new URLSearchParams(url.search);
			const videoId = params.get('v');
			if (videoId !== null) {
				if (socket) {
					socket.emit('url', { videoId: videoId, room: $page.params.roomId });
				}
			}
		} else if (url.hostname === 'youtu.be') {
			const videoId = url.toString().split('/').pop()?.split('?').at(0);
			if (videoId !== undefined) {
				if (socket) {
					socket.emit('url', { videoId: videoId, room: $page.params.roomId });
				}
			}
		}
	}

	let usernameInput: HTMLInputElement | undefined;
	function onSetUsername() {
		if (!usernameInput) {
			return;
		}
		username = usernameInput.value;
		usernameInput.value = '';
		localStorage.setItem('username', username);
	}

	let messageInput: HTMLInputElement | undefined;
	async function onMessageSend() {
		if (!messageInput || !socket) {
			return;
		}
		const message = `${username}: ${messageInput.value}`;
		socket.emit('message', { room: $page.params.roomId, value: message });
		messageInput.value = '';
		chats = chats;
	}

	let timeInterval: ReturnType<typeof setInterval>;
	onMount(() => {
		vmPlayer.addEventListener('vmPlay', () => {
			if (socket) {
				socket.emit('play', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			}
		});
		vmPlayer.addEventListener('vmPausedChange', ((event: CustomEvent<boolean>) => {
			if (event.detail && socket) {
				socket.emit('pause', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			}
		}) as EventListener);
		vmPlayer.addEventListener('vmBufferingChange', ((event: CustomEvent<boolean>) => {
			if (event.detail && socket) {
				socket.emit('pause', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			} else if (!event.detail && socket) {
				socket.emit('play', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			}
		}) as EventListener);
		vmPlayer.addEventListener('vmSeeked', () => {
			if (socket) {
				socket.emit('seek', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			}
		});
		timeInterval = setInterval(() => {
			if (socket && vmPlayer.playing) {
				socket.emit('time', { room: $page.params.roomId, time: vmPlayer.currentTime ?? 0 });
			}
		}, 3000);
	});

	onDestroy(() => {
		clearInterval(timeInterval);
	});
</script>

<h1>Room</h1>

<svelte:head>
	<title>Room</title>
</svelte:head>

<div class="row">
	<div class="col-lg-9">
		<div class="mb-3 input-group">
			<input
				on:keypress={(event) => {
					if (event.key === 'Enter') {
						onPlayUrl();
					}
				}}
				id="vid_url"
				type="url"
				class="form-control"
				placeholder="URL"
			/>
			<button on:click={onPlayUrl} type="button" class="btn btn-danger">Play</button>
		</div>
		<vm-player bind:this={vmPlayer}>
			<vm-youtube video-id={data.videoId} />
			<vm-default-ui />
		</vm-player>
	</div>
	<div class="col-lg-3 mt-3 mt-lg-0">
		<div class="chat-container">
			{#if socket === undefined}
				<div class="alert alert-secondary">Connecting to server</div>
			{/if}
			<label for="username_input">Username</label>
			<div class="mt-3 mb-3 input-group">
				<input
					bind:this={usernameInput}
					on:keypress={(event) => {
						if (event.key === 'Enter') {
							onSetUsername();
						}
					}}
					type="text"
					class="form-control"
				/>
				<button id="username_input" on:click={onSetUsername} type="button" class="btn btn-primary"
					>Set</button
				>
			</div>
			{#if username !== null}
				<div class="chat-messages-container">
					<div class="list-group">
						{#each chats as chat}
							<div style="word-wrap:break-word" class="list-group-item">{chat}</div>
						{/each}
					</div>
				</div>
				<div class="mt-3 input-group">
					<input
						on:keypress={(event) => {
							if (event.key === 'Enter') {
								onMessageSend();
							}
						}}
						bind:this={messageInput}
						type="text"
						placeholder="Type Message"
						class="form-control"
					/>
					<button on:click={onMessageSend} type="button" class="btn btn-primary">Send</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.chat-messages-container {
		display: flex;
		flex-direction: column-reverse;
		overflow-y: auto;
		max-height: 500px;
	}
</style>
