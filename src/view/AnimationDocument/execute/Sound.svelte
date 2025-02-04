<script lang='ts'>
	import type { AnimationSetContentsItem } from 'schema/payload';

	export let data: AnimationSetContentsItem<'sound'>;
	export let readonly: boolean;

	// @ts-expect-error TODO: Sequencer Types
	const entries: string[] = window.Sequencer.Database.publicFlattenedSimpleEntries;
</script>
{#if !data.execute}
	{#if !readonly}
		<p><em>Attempted to render a 'sound' execute section without an execute object present.</em></p>
	{/if}
{:else}
	<div class='space-y-2'>
		<label class='grid grid-cols-3 items-center'>
			<span class='flex items-center' data-tooltip='TODO: Explain'>
				Sound
				<i class='fa fa-info-circle px-2 ml-auto'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<datalist id='graphic'>
					{#each entries as name}
						<option>{name}</option>
					{/each}
				</datalist>
				<input
					list='graphic'
					type='text'
					value={data.execute.sound}
					on:change={(e) => {
						if (!data.execute) data.execute = {};
						if (e.currentTarget.value) {
							data.execute.sound = [e.currentTarget.value];
						} else {
							data.execute.sound = [];
						};
					}}
					{readonly}
					disabled={readonly}
				/>
			</div>
		</label>
	</div>
{/if}
