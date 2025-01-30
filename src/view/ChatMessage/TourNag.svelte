<script lang='ts'>
	import type { ChatMessagePF2e } from 'foundry-pf2e';
	import { i18n } from 'src/utils';

	export let message: ChatMessagePF2e;
	const { unstartedTourConfigs } = message.flags['pf2e-graphics'] as { unstartedTourConfigs: TourConfig[] };

	function close(unstartedTourConfigs: TourConfig[]): undefined {
		unstartedTourConfigs.forEach((tourConfig) => {
			const tour = getTourDoc(tourConfig);
			tour.progress(0).then(() => tour.exit()); // Tour isn't completed, so don't complete it 😤
		});
		message.delete();
	}

	function getTourDoc(tour: TourConfig) {
		return window.game.tours.get(`${tour.namespace}.${tour.id}`) as Tour;
	}
</script>

<div class='pf2e-g'>
	<h2>Welcome to <i>PF2e Graphics!</i></h2>

	<p>Do you want a tour? :)</p>

	{#each unstartedTourConfigs as tourConfig}
		{@const tourDoc = getTourDoc(tourConfig)}
		<button
			on:click={() => tourDoc.start()}
			disabled={tourDoc?.status !== 'unstarted'}
			class:line-through={tourDoc?.status !== 'unstarted'}
		>
			Yes! I want to learn about <i>{i18n(tourConfig.title)}</i>.
		</button>
	{/each}

	<hr />
	<button class="" on:click={() => close(unstartedTourConfigs)}>
		<b>Never speak to me again >:(</b>
	</button>
</div>
