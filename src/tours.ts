const sidebarTour: TourConfig = {
	id: 'sidebar',
	namespace: 'pf2e-graphics',
	title: 'pf2e-graphics.tours.sidebar.title',
	description: 'pf2e-graphics.tours.sidebar.description',
	display: true,
	steps: [
		{
			id: '1',
			title: 'pf2e-graphics.tours.sidebar.steps.1.title',
			content: 'pf2e-graphics.tours.sidebar.steps.1.content',
		},
		{
			id: '2',
			title: 'pf2e-graphics.tours.sidebar.steps.2.title',
			content: 'pf2e-graphics.tours.sidebar.steps.2.content',
			selector: 'a[data-tab="graphics"]',
			tooltipDirection: 'UP',
		},
		{
			id: '3',
			title: 'pf2e-graphics.tours.sidebar.steps.3.title',
			content: 'pf2e-graphics.tours.sidebar.steps.3.content',
			selector: 'a[data-tab="playlists"]',
			tooltipDirection: 'UP',
		},
		{
			id: '4',
			title: 'pf2e-graphics.tours.sidebar.steps.4.title',
			content: 'pf2e-graphics.tours.sidebar.steps.4.content',
		},
	],
};

const tourConfigs = [sidebarTour] as const;

interface TourProgress {
	[Namespace: string]: {
		[ID: string]: number; // -1 = not started; 0..N-1 = at Nth step; N === Tour.steps.length = tour complete
	};
}

/**
 * TODO: document this
 */
export async function registerTours() {
	const tourProgress = game.settings.get('core', 'tourProgress') as TourProgress;
	const unstartedTours = [];
	for (const tourConfig of tourConfigs) {
		game.tours.register(tourConfig.namespace, tourConfig.id, new Tour(tourConfig, {})); // TODO: report that 2nd override object is optional
		if (tourProgress[tourConfig.namespace][tourConfig.id] === -1) unstartedTours.push(tourConfig);
	}
	ChatMessage.create({
		// @ts-expect-error TODO: report that this should be `number`, not `string`
		type: CONST.CHAT_MESSAGE_STYLES.OOC,
		speaker: {
			alias: 'PF2e Graphics',
		},
		// TODO:
		// - Make this prettier
		// - Add buttons to start unstarted tours, plus one to hide message forever by setting all unstarted tours to status 1
		// - Move this entire thing to localisation file
		content: `
			<h2>Welcome to <i>PF2e Graphics</i>!</h2>
			<p>Do you want a tour? :)</p>
			<ul>
				${unstartedTours.map(tour => `<li>Yes! I want to learn about: <code>${tour.id}</code></li>`)}
			</ul>
			<hr />
			<ul>
				<li><b>Never speak to me again >:(</b></li>
			</ul>
		`,
		whisper: [game.userId],
	});
}
