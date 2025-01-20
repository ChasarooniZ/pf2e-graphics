import { DB_PREFIX as assetDbPrefix, database as videoDb } from './assetDb';
import { database as soundDb, DB_PREFIX as soundDbPrefix } from './soundDb';

Hooks.once('sequencerReady', () => {
	Sequencer.Database.registerEntries(soundDbPrefix, soundDb);
	Sequencer.Database.registerEntries(assetDbPrefix, videoDb);
});

if (import.meta.hot) {
	// Prevents reloads
	import.meta.hot.accept();

	if (window.Sequencer) {
		// @ts-expect-error https://github.com/fantasycalendar/FoundryVTT-Sequencer/pull/384
		Sequencer.Database.registerEntries(soundDbPrefix, soundDb, false, true);
		// @ts-expect-error https://github.com/fantasycalendar/FoundryVTT-Sequencer/pull/384
		Sequencer.Database.registerEntries(assetDbPrefix, videoDb, false, true);
	}
}
