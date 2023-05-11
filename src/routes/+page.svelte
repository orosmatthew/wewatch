<script lang="ts">
	import { enhance } from '$app/forms';

	import type { Actions } from './$types';

	export let form: Actions;
</script>

<svelte:head>
	<title>WeWatch</title>
</svelte:head>

{#if form && !form.success}
	<div class="alert alert-danger">{form.message ?? 'Unknown error'}</div>
{/if}

<form style="text-align:center" method="POST" action="?/create" use:enhance>
	<button type="submit" class="btn btn-success">Create Room</button>
</form>
