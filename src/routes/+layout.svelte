<script context="module" lang="ts">
	export const socketUrl = writable('');
</script>

<script lang="ts">
	import 'bootstrap-dark-5/dist/css/bootstrap-dark.css';
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
		<ul class="nav col-12 col-md-auto justify-content-center">
			<li><a href="/" class="nav-link px-2">Home</a></li>
		</ul>
	</header>
	<hr />
	<slot />
</div>
