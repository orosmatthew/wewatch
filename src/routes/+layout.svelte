<script context="module" lang="ts">
	export const socketUrl = writable('');
</script>

<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import { writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	$socketUrl = data.socketUrl;
</script>

<div class="container">
	<header style="font-size: 24px; position: relative" class="mt-3">
		<div style="text-align:center">
			<h1 class="logo">
				<a href="/"><span>We</span>Watch</a>
			</h1>
		</div>
		<a href="https://github.com/orosmatthew/wewatch" target="_blank" class="gh">
			<i class="bi bi-github" />
		</a>
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
	.gh,
	.gh:visited,
	.gh:active {
		position: absolute;
		right: 0%;
		bottom: 0%;
		text-decoration: none;
		color: inherit;
		transform: scale(1);
	}
	.gh:hover {
		cursor: pointer;
		transition-duration: 0.1s;
		transform: scale(1.2);
	}
</style>
