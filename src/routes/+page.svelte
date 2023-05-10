<script lang="ts">
	import { browser } from '$app/environment';
	import { defineCustomElements } from '@vime/core';
	import '@vime/core/themes/default.css';
	if (browser) {
		defineCustomElements();
	}
</script>

<h1>WeWatch</h1>

<div style="width:50%">
	<vm-player>
		<vm-youtube video-id="DyTCOwB0DVw" />
		<vm-default-ui />
	</vm-player>
</div>
