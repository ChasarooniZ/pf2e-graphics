<script lang='ts'>
	import type { AnimationSetContentsItem } from 'schema/payload';

	export let dataO: AnimationSetContentsItem;
	export let readonly: boolean;

	const data = dataO as AnimationSetContentsItem<'macro'>;
</script>
{#if !data.execute}
	{#if !readonly}
		<p><em>Attempted to render a 'macro' execute section without an execute object present.</em></p>
	{/if}
{:else}
	<div class='space-y-2'>
		<label class='grid grid-cols-3 items-center'>
			<span data-tooltip='TODO: Explain'>
				UUID
				<i class='fa fa-info-circle pl-px'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<input
					placeholder='Drag a macro or type in the UUID...'
					type='text'
					bind:value={data.execute.document}
					disabled={readonly}
					{readonly}
				/>
			</div>
		</label>
		<label class='grid grid-cols-3 items-center'>
			<span data-tooltip='TODO: Explain'>
				Execute for Everyone
				<i class='fa fa-info-circle pl-px'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<input
					type='checkbox'
					bind:value={data.execute.everyoneExecutes}
					disabled={readonly}
					{readonly}
				/>
			</div>
		</label>
	</div>
{/if}
