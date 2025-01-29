<script lang='ts'>
	import type { ChatMessagePF2e } from 'foundry-pf2e';
	import { i18n } from 'src/utils';

	export let message: ChatMessagePF2e;
	const { unstartedTourConfigs } = message.flags['pf2e-graphics'] as { unstartedTourConfigs: TourConfig[] };

	function close() {
		window.game.settings.set('pf2e-graphics', 'tourNag', false);
		message.delete();
	}

	function getTourDoc(tour: TourConfig) {
		return window.game.tours.get(`${tour.namespace}.${tour.id}`) as Tour;
	}
</script>

<div class='pf2e-g'>
	<h2>Welcome to <i>PF2e Graphics!</i></h2>

	<p>Do you want a tour? :)</p>

	{#each unstartedTourConfigs as tour}
		{@const tourDoc = getTourDoc(tour)}
		<button
			on:click={() => tourDoc.start()}
			disabled={tourDoc?.status !== 'unstarted'}
			class:line-through={tourDoc?.status !== 'unstarted'}
		>
			Yes! I want to learn about the <i>{i18n(tour.title)}</i>.
		</button>
	{/each}

	<hr />
	<button class='' on:click={close}>

		<b>Never speak to me again >:(</b>
	</button>
</div>
