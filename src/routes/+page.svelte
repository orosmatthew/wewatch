<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { defineCustomElements } from '@vime/core';
	import '@vime/core/themes/default.css';
	import type { Actions } from './$types';

	export let form: Actions;

	if (browser) {
		defineCustomElements();
	}
</script>

<h1>WeWatch</h1>

{#if form && !form.success}
	<div class="alert alert-danger">{form.message ?? 'Unknown error'}</div>
{/if}

<form method="POST" action="?/create" use:enhance>
	<button type="submit" class="btn btn-success">Create Room</button>
</form>

<!-- <div style="width:50%">
	<vm-player>
		<vm-youtube video-id="DyTCOwB0DVw" />
		<vm-default-ui />
	</vm-player>
</div> -->
