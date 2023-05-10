<script lang="ts">
	import 'bootstrap-dark-5/dist/css/bootstrap-dark.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		await import('bootstrap');
	});
</script>

<div class="container">
	<slot />
</div>
