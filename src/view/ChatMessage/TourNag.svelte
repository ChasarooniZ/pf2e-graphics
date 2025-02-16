<script lang='ts'>
	import type { ChatMessagePF2e } from 'foundry-pf2e';
	import { i18n, info } from 'src/utils';

	export let message: ChatMessagePF2e;
	const { unstartedTourConfigs } = message.flags['pf2e-graphics'] as {
		unstartedTourConfigs: TourConfig[];
	};

	function neverSpeakToMeAgain() {
		window.game.tours
			.keys()
			.filter(str => str.startsWith('pf2e-graphics.'))
			.forEach((tourName) => {
				const tour = window.game.tours.get(tourName) as Tour;
				if (tour.status === 'unstarted') tour.progress(0).then(() => tour.exit()); // Tour isn't completed, so don't complete it 😤
			});
		info('pf2e-graphics.messages.tourNag.farewellToast');
		message.delete();
	}

	function getTourDoc(tour: TourConfig) {
		return window.game.tours.get(`${tour.namespace}.${tour.id}`) as Tour;
	}
</script>

<div class='pf2e-g'>
	<h2>{@html i18n('pf2e-graphics.messages.tourNag.header')}</h2>

	<p>{@html i18n('pf2e-graphics.messages.tourNag.body')}</p>
	<p style:font-size='1.15em'><b>{i18n('pf2e-graphics.messages.tourNag.doYouWantATour')}</b> :)</p>

	<div style:margin-left='1em' style:margin-right='1em'>
		{#each unstartedTourConfigs as tourConfig}
			{@const tour = getTourDoc(tourConfig)}
			<button
				on:click={() => tour.start()}
				disabled={tour?.status !== 'unstarted'}
				class:line-through={tour?.status !== 'unstarted'}
			>
				<i class='fas fa-play'></i>
				{i18n(tourConfig.title)}
			</button>
		{/each}
		<!-- TODO: pending https://github.com/7H3LaughingMan/foundry-pf2e/pull/605 -->
		<!-- svelte-ignore missing-declaration -->
		<button
			on:click={() => {
				// @ts-expect-error TODO: pending https://github.com/7H3LaughingMan/foundry-pf2e/pull/605
				new ToursManagement().render(true, { activeCategory: 'pf2e-graphics' });
			}}
		>
			<i class='fas fa-person-hiking'></i>
			<i>{i18n('pf2e-graphics.messages.tourNag.buttons.seeAllTours')}</i>
		</button>
		<hr />
		<button on:click={() => neverSpeakToMeAgain()}>
			<i class='fas fa-xmark'></i>
			<b>{i18n('pf2e-graphics.messages.tourNag.buttons.neverSpeakToMeAgain')}</b> &gt;:(
		</button>
	</div>
</div>
