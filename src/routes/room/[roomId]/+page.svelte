<script lang="ts">
	import { browser } from '$app/environment';
	import { io } from 'socket.io-client';
	import { socketUrl } from '../../+layout.svelte';

	if (browser) {
		const socket = io($socketUrl);
		socket.on('test', () => {
			console.log('HERE!');
		});
	}
</script>

<h1>Room</h1>

<svelte:head>
	<title>Room</title>
</svelte:head>

<div style="width:50%">
	<vm-player>
		<vm-youtube video-id="DyTCOwB0DVw" />
		<vm-default-ui />
	</vm-player>
</div>
