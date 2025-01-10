<script lang='ts'>
	import type { AnimationSetContentsItem } from 'schema/payload';
	import { TJSDialog } from '@typhonjs-fvtt/runtime/svelte/application';

	export let selection: number | string;
	export let section: AnimationSetContentsItem;
	export let index: string;
	export let deleteFn: (location: string) => void;

	function addContent() {
		if (!section.contents) section.contents = [];
		section.contents.push({});
		section = section;
	}

	function deleteSection(e: MouseEvent) {
		if (e.shiftKey) {
			deleteFn(index);
		} else {
			TJSDialog.confirm({
				modal: true,
				title: 'Confirm Deletion',
				content: 'Are you sure you want to delete this section?<p/><b>All data will be lost.</b>',
				onYes: () => { deleteFn(index); },
			});
		}
	}
</script>

<section
	role='button'
	tabindex='-1'
	on:keypress|stopPropagation={() => selection = index}
	on:click|stopPropagation={() => selection = index}
	class:shadow-inner={selection === index}
	class='
		hover:bg-slate-600/20
		border-0 border-b border-solid [&_&]:border-l
		p-1 [&_&]:px-0 [&_&]:pl-1
		shadow-slate-600
	'>
	<div class='flex'>
		<span class='grow'>
			{#if section?.name}
				{section.name}
			{:else}
				Section {index}
			{/if}
		</span>
		<button on:click|stopPropagation={addContent} class='size-min text-xs mx-0.5 p-0 px-1'>
			<i class='fa fa-plus fa-fw m-0 p-0'></i>
		</button>
		<button on:click|stopPropagation={deleteSection} class='size-min text-xs mx-0.5 p-0 px-1'>
			<i class='fa fa-trash fa-fw m-0 p-0'></i>
		</button>
	</div>
	{#if section?.contents}
		<div class='pl-2'>
			{#each section.contents as content, nextIndex}
				<svelte:self
					bind:selection={selection}
					section={content}
					index={`${index}.${nextIndex}`}
					{deleteFn}
				/>
			{/each}
		</div>
	{/if}
</section>
