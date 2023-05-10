<script lang="ts">
	import { browser } from '$app/environment';
	import { Socket, io } from 'socket.io-client';
	import { socketUrl } from '../../+layout.svelte';
	import { defineCustomElements } from '@vime/core';
	import '@vime/core/themes/default.css';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

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
	if (browser) {
		username = localStorage.getItem('username');
		defineCustomElements();
		socket = io($socketUrl);
		if ($page.params.roomId) {
			socket.emit('join', $page.params.roomId);
		}
		socket.on('recvMessage', (message) => {
			chats.push(message);
			chats = chats;
		});
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
		socket.emit('sendMessage', { room: $page.params.roomId, value: message });
		messageInput.value = '';
		chats = chats;
	}
</script>

<h1>Room</h1>

<svelte:head>
	<title>Room</title>
</svelte:head>

<!-- <div style="width:50%">
	<vm-player>
		<vm-youtube video-id="DyTCOwB0DVw" />
		<vm-default-ui />
	</vm-player>
</div> -->

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
					<div class="list-group-item">{chat}</div>
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

<style>
	.chat-messages-container {
		display: flex;
		flex-direction: column-reverse;
		overflow: scroll;
		height: 500px;
	}

	.chat-container {
		width: 50%;
	}
</style>
