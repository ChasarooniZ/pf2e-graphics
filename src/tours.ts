/**
 * Defines and registers the module's tours with Foundry.
 *
 * During registration, it checks whether the user has started the tour. If any tour is unstarted, a private chat message offering to start the tours is posted.
 */
export async function registerTours() {
	/**
	 * An array of `TourConfig`s that define the tours that *PF2e Graphics* adds.
	 */
	const newTourConfigs: TourConfig[] = [
		{
			namespace: 'pf2e-graphics',
			id: 'sidebar',
			title: 'pf2e-graphics.tours.sidebar.title',
			description: 'pf2e-graphics.tours.sidebar.description',
			display: true,
			canBeResumed: true,
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
				},
				{
					id: '3',
					title: 'pf2e-graphics.tours.sidebar.steps.3.title',
					content: 'pf2e-graphics.tours.sidebar.steps.3.content',
					selector: '#graphics',
					// @ts-expect-error https://github.com/foundryvtt/foundryvtt/issues/12065
					sidebarTab: 'graphics',
					tooltipDirection: 'LEFT',
				},
				{
					id: '4',
					title: 'pf2e-graphics.tours.sidebar.steps.4.title',
					content: 'pf2e-graphics.tours.sidebar.steps.4.content',
					selector: '#pf2e-graphics-bundled-sets',
					// @ts-expect-error https://github.com/foundryvtt/foundryvtt/issues/12065
					sidebarTab: 'graphics',
					tooltipDirection: 'LEFT',
				},
				{
					id: '5',
					title: 'pf2e-graphics.tours.sidebar.steps.5.title',
					content: 'pf2e-graphics.tours.sidebar.steps.5.content',
					selector: '#pf2e-graphics-custom-sets',
					// @ts-expect-error https://github.com/foundryvtt/foundryvtt/issues/12065
					sidebarTab: 'graphics',
					tooltipDirection: 'LEFT',
				},
				{
					id: '6',
					title: 'pf2e-graphics.tours.sidebar.steps.6.title',
					content: 'pf2e-graphics.tours.sidebar.steps.6.content',
					selector: '.playlist-sounds #pf2e-graphics-volume-slider',
					// @ts-expect-error https://github.com/foundryvtt/foundryvtt/issues/12065
					sidebarTab: 'playlists',
					tooltipDirection: 'LEFT',
				},
				{
					id: '7',
					title: 'pf2e-graphics.tours.sidebar.steps.7.title',
					content: 'pf2e-graphics.tours.sidebar.steps.7.content',
				},
			],
		},
	] as const;

	// Get the secret tour progress-tracker for the client
	const tourProgress = game.settings.get('core', 'tourProgress') as {
		[Namespace: string]: {
			[ID: string]: number;
			//                    -1 :: not started
			//              0..(N-1) :: completed Nth step
			// N = Tour.steps.length :: all complete
		};
	};

	const unstartedTourConfigs: TourConfig[] = [];

	// Register tours
	for (const newTourConfig of newTourConfigs) {
		// @ts-expect-error https://github.com/7H3LaughingMan/foundry-pf2e/pull/602
		game.tours.register(newTourConfig.namespace, newTourConfig.id, new SidebarTour(newTourConfig, {}));
		if (
			tourProgress[newTourConfig.namespace] === undefined
			|| tourProgress[newTourConfig.namespace][newTourConfig.id] === undefined
			|| tourProgress[newTourConfig.namespace][newTourConfig.id] === -1
		) {
			unstartedTourConfigs.push(newTourConfig);
		}
	}

	// Post ~~nagging~~ welcome message if client has unstarted PF2e Graphics tours
	if (unstartedTourConfigs.length) {
		ChatMessage.create({
			style: CONST.CHAT_MESSAGE_STYLES.OOC,
			speaker: {
				alias: 'PF2e Graphics',
			},
			// TODO:
			// - Make this prettier
			// - Add buttons to start unstarted tours, plus one to hide message forever by setting all unstarted tours to status 0
			// - Move this entire thing to localisation file
			content: `
				<h2>Welcome to <i>PF2e Graphics</i>!</h2>
				<p>Do you want a tour? :)</p>
				<ul>
					${unstartedTourConfigs.map(tour => `<li>Yes! I want to learn about: <code>${tour.id}</code></li>`)}
				</ul>
				<hr />
				<ul>
					<li><b>Never speak to me again >:(</b></li>
				</ul>
			`,
			whisper: [game.userId],
		});
	}
}
