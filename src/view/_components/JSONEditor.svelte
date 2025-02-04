<script lang='ts'>
	import type { Mode } from 'svelte-jsoneditor';

	export let json: object;
	export let mode: Mode = 'text' as Mode;
</script>

{#await import('svelte-jsoneditor')}
	Waiting for extra JSONEditor code...
{:then Module}
	<Module.JSONEditor
		content={{ json }}
		readOnly={true}
		{mode}
		navigationBar={false}
		statusBar={false}
		indentation='	'
		tabSize={2}
	/>
{/await}

<style>
	:global(button.jse-last) {
		display: none !important;
	}

	:global(.jse-button.jse-group-button:not(.jse-last)) {
		border-right: 1px solid var(--jse-menu-color, var(--jse-text-color-inverse, #fff)) !important;
	}
</style>
