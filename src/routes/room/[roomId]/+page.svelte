<script lang="ts">
	import { browser } from '$app/environment';
	import { Socket, io } from 'socket.io-client';
	import { socketUrl } from '../../+layout.svelte';
	import { defineCustomElements } from '@vime/core';
	import '@vime/core/themes/default.css';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let data: PageData;

	let chats: { username: string; value: string }[] = [];
	let users: Set<string> = new Set();

	data.messages
		.sort((a, b) => {
			return a.createdAt.valueOf() - b.createdAt.valueOf();
		})
		.forEach((message) => {
			chats.push({ username: message.username, value: message.value });
		});

	let username: string | null = null;
	let socket: Socket | undefined;
	let vmPlayer: HTMLVmPlayerElement;
	if (browser) {
		defineCustomElements();
		socket = io($socketUrl);
		socket.emit('start', $page.params.roomId);
		data.users.forEach((user) => {
			users.add(user.username);
		});
		socket.on('message', (message: { username: string; value: string }) => {
			chats.push(message);
			chats = chats;
		});
		socket.on('url', (data: { videoId: string; time: number }) => {
			playYoutube(data.videoId, data.time);
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
		socket.on('join', (name) => {
			users.add(name);
			users = users;
		});
		socket.on('leave', (name) => {
			users.delete(name);
			users = users;
		});
	}

	function playYoutube(id: string, time: number) {
		const vmPlayer = document.querySelector('vm-player') as HTMLVmPlayerElement;
		const vmYoutube = document.querySelector('vm-youtube') as HTMLVmYoutubeElement;
		vmPlayer.removeChild(vmYoutube);
		const newVmYoutube = document.createElement('vm-youtube');
		newVmYoutube.videoId = id;
		vmPlayer.appendChild(newVmYoutube);
		vmPlayer.addEventListener(
			'vmPlaybackReady',
			() => {
				vmPlayer.currentTime = time;
			},
			{ once: true }
		);
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
			const videoTimeStr = params.get('t');
			const videoTime = videoTimeStr ? parseInt(videoTimeStr) : null;
			if (videoId !== null) {
				if (socket) {
					socket.emit('url', { videoId: videoId, time: videoTime });
				}
			}
		} else if (url.hostname === 'youtu.be') {
			const videoId = url.toString().split('/').pop()?.split('?').at(0);
			const params = new URLSearchParams(url.search);
			const videoTimeStr = params.get('t');
			const videoTime = videoTimeStr ? parseInt(videoTimeStr) : null;
			if (videoId !== undefined) {
				if (socket) {
					socket.emit('url', { videoId: videoId, time: videoTime });
				}
			}
		}
	}

	let modalUsernameError = false;
	async function onModalUsernameSet() {
		if (!socket) {
			return;
		}
		const input = document.getElementById('modal_username_input') as HTMLInputElement;
		const res: { success: boolean } = await socket.emitWithAck('join', input.value);
		if (res.success !== true) {
			modalUsernameError = true;
			return;
		}
		username = input.value;
		localStorage.setItem('username', username);
	}

	let messageInput: HTMLInputElement | undefined;
	async function onMessageSend() {
		if (!messageInput || !socket || !username) {
			return;
		}
		socket.emit('message', { username: username, value: messageInput.value });
		messageInput.value = '';
		chats = chats;
	}

	let videoTitle: string | undefined;
	let timeInterval: ReturnType<typeof setInterval>;
	onMount(async () => {
		const bootstrap = await import('bootstrap');
		const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
		[...popoverTriggerList].map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl));

		popoverTriggerList.forEach((popover) => {
			popover.addEventListener('shown.bs.popover', () => {
				setTimeout(() => {
					const bsPopover = bootstrap.Popover.getInstance(popover);
					if (bsPopover) {
						bsPopover.hide();
					}
				}, 1500);
			});
		});

		vmPlayer.currentTime = data.videoTime;
		vmPlayer.addEventListener('vmPlay', () => {
			if (socket) {
				socket.emit('play', { time: vmPlayer.currentTime ?? 0 });
			}
		});
		vmPlayer.addEventListener('vmPausedChange', ((event: CustomEvent<boolean>) => {
			if (event.detail && socket) {
				socket.emit('pause', { time: vmPlayer.currentTime ?? 0 });
			}
		}) as EventListener);
		vmPlayer.addEventListener('vmBufferingChange', ((event: CustomEvent<boolean>) => {
			if (event.detail && socket) {
				socket.emit('pause', { time: vmPlayer.currentTime ?? 0 });
			} else if (!event.detail && socket) {
				socket.emit('play', { time: vmPlayer.currentTime ?? 0 });
			}
		}) as EventListener);
		vmPlayer.addEventListener('vmSeeked', () => {
			if (socket) {
				socket.emit('seek', { time: vmPlayer.currentTime ?? 0 });
			}
		});
		timeInterval = setInterval(() => {
			if (socket && vmPlayer.playing) {
				socket.emit('time', { time: vmPlayer.currentTime ?? 0 });
			}
			videoTitle = vmPlayer?.mediaTitle;
		}, 3000);
	});

	onDestroy(() => {
		clearInterval(timeInterval);
		if (socket) {
			socket.close();
		}
	});
</script>

<svelte:head>
	<title>{videoTitle ? `${videoTitle} - WeWatch` : 'WeWatch'}</title>
</svelte:head>

<div class="row">
	<div class="col-lg-9">
		<h1>{videoTitle ?? 'Room'}</h1>
	</div>
</div>

{#if username === null}
	<div transition:fade={{ duration: 300 }}>
		<div class="overlay" />
		<div class="container username-modal">
			<h2 class="mt-4">Enter a Username</h2>
			<div class="mt-4 input-group">
				<input
					on:keypress={(event) => {
						if (event.key === 'Enter') {
							onModalUsernameSet();
						}
					}}
					id="modal_username_input"
					type="text"
					placeholder="username"
					class={`form-control ${modalUsernameError ? 'is-invalid' : ''}`}
					value={browser ? localStorage.getItem('username') ?? '' : ''}
				/>
				<button on:click={onModalUsernameSet} type="button" class="btn btn-success">Set</button>
			</div>
			{#if modalUsernameError}
				<div class="text-danger">Username already taken</div>
			{/if}
		</div>
	</div>
{/if}
<div class="row mb-3">
	<div class="col-lg-9 mb-3 mb-lg-0">
		<div class="input-group">
			<input
				on:keypress={(event) => {
					if (event.key === 'Enter') {
						onPlayUrl();
					}
				}}
				id="vid_url"
				type="url"
				class="form-control"
				placeholder="YouTube URL"
			/>
			<button on:click={onPlayUrl} type="button" class="btn btn-danger"
				><i class="bi bi-play-btn" /></button
			>
		</div>
	</div>
	<div class="col-lg-3 text-end">
		<div class="input-group">
			<input readonly class="form-control" value={$page.url.toString()} />
			<button
				on:click={() => {
					navigator.clipboard.writeText($page.url.toString());
				}}
				type="button"
				class="btn btn-outline-success"
				data-bs-trigger="click"
				data-bs-delay={'{"show":0,"hide":1}'}
				data-bs-container="body"
				data-bs-toggle="popover"
				data-bs-placement="top"
				data-bs-content="Copied!"><i class="bi bi-share" /></button
			>
		</div>
	</div>
</div>
<div class="row">
	<div class="col-lg-9">
		<vm-player bind:this={vmPlayer}>
			<vm-youtube video-id={data.videoId} />
			<vm-default-ui />
		</vm-player>
		<h3 class="mt-3">Users</h3>
		<div style="margin-left:0" class="ml-3 mt-2 row">
			{#each [...users] as user}
				<div transition:fade={{ duration: 300 }} class="user">{user}</div>
			{/each}
		</div>
	</div>
	<div class="col-lg-3 mt-3 mt-lg-0">
		<div class="chat-container">
			{#if socket === undefined}
				<div class="alert alert-secondary">Connecting to server</div>
			{/if}

			<div class="chat-messages-container">
				<div class="list-group">
					{#each chats as chat}
						<div style="word-wrap:break-word" class="list-group-item">
							<span style="color:rgb(33, 37, 41)" class="badge bg-secondary">{chat.username}</span>
							{chat.value}
						</div>
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
				<button on:click={onMessageSend} type="button" class="btn btn-primary"
					><i class="bi bi-send" /></button
				>
			</div>
		</div>
	</div>
</div>

<style>
	.chat-messages-container {
		display: flex;
		flex-direction: column-reverse;
		overflow-y: auto;
		max-height: 550px;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
		z-index: 51;
	}

	.username-modal {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 400px;
		height: 180px;
		background-color: rgb(49, 55, 62);
		border-radius: 10px;
		z-index: 52;
	}
	.user {
		width: fit-content;
		font-size: 18px;
		border-radius: 5px;
		color: rgb(34, 34, 34);
		background-color: rgb(38, 198, 157);
		padding: 5px;
		margin: 4px;
	}
</style>
