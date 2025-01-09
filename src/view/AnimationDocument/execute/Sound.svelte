<script lang='ts'>
	import type { AnimationSetContentsItem } from 'schema/payload';

	export let dataO: AnimationSetContentsItem;
	export let readonly: boolean;

	$: data = dataO as AnimationSetContentsItem<'sound'>;
</script>
{#if !data.execute}
	{#if !readonly}
		<p><em>Attempted to render a 'sound' execute section without an execute object present.</em></p>
	{/if}
{:else}
	<div class='space-y-2'>
		<label class='grid grid-cols-3 items-center'>
			<span data-tooltip='TODO: Explain'>
				Text Text
				<i class='fa fa-info-circle pl-px'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<input
					type='text'
					disabled={readonly}
				/>
			</div>
		</label>
	</div>
{/if}
