<script context="module" lang="ts">
	export const socketUrl = writable('');
</script>

<script lang="ts">
	import 'bootstrap-dark-5/dist/css/bootstrap-dark.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	$socketUrl = data.socketUrl;

	onMount(async () => {
		await import('bootstrap');
	});
</script>

<div class="container">
	<header style="font-size: 24px" class="mt-2 d-flex align-items-center justify-content-center">
		<h1 class="logo">
			<a href="/"><span>We</span>Watch</a>
		</h1>
	</header>
	<hr />
	<slot />
</div>

<style>
	.logo {
		font-weight: bold;
	}
	.logo a {
		text-decoration: none;
		color: rgb(213, 209, 204);
	}
	.logo a:hover a:visited a:active {
		color: inherit;
		text-decoration: none;
	}
	.logo span {
		color: rgb(38, 198, 157);
	}
</style>
