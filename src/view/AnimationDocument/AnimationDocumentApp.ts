import type { AnimationSetDocument, UserAnimationSetDocument, WorldAnimationSetDocument } from 'src/extensions';
import type { Mode } from 'svelte-jsoneditor';
import { type SvelteApp, SvelteApplication } from '#runtime/svelte/application';
import { ErrorMsg, i18n, kofiButton, log } from '../../utils';
import BasicAppShell from './AnimationDocument.svelte';

export default class AnimationDocumentApp extends SvelteApplication<BasicAppOptions> {
	constructor(options?: Partial<BasicAppOptions>) {
		super(options);
		if (!options?.animation) throw ErrorMsg.send('pf2e-graphics.document.error.noData');

		this.options.id = `pf2e-graphics-document-${game.pf2e.system.sluggify(options.animation.rollOption)}`;
		if ('id' in options.animation) {
			this.options.id = `${this.options.id}-${options.animation.id}`;

			try {
				// Attempt to parse session storage item and set to application state.
				this.state.set(JSON.parse(sessionStorage.getItem(`${this.options.id}`) || '{}'));
			} catch { }
		}

		if (this.options.animation.source === 'module') {
			this.options.readonly = true;
			this.options.title = `${i18n('pf2e-graphics.document.title')} (Read-only)`;
		}

		if (this.options.readonly) {
			this.options.animation = Object.freeze(foundry.utils.deepClone(this.options.animation));
		}

		log('AnimationDocumentApp', this);
	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			...super.defaultOptions,
			id: 'pf2e-graphics-document',
			title: 'pf2e-graphics.document.title',
			classes: ['pf2e-g', 'no-window-padding'],
			resizable: true,
			width: 800,
			height: 600,

			readonly: false,
			tab: 'main',
			jsonMode: 'text',

			svelte: {
				class: BasicAppShell,
				target: document.body,
				intro: true,
			},
		});
	}

	/**
	 * Validates the data and returns the object if it is valid with success: true.
	 * Otherwise, we get success: false with an error getter.
	 */
	async validate(_animation: AnimationSetDocument = this.options.animation) {
		const { animationSets } = await import('schema/index');
		return animationSets.safeParse(_animation.animationSets);
	}

	async save(_animation: AnimationSetDocument = this.options.animation) {
		log('Saving data.', _animation);
		switch (_animation.source) {
			case 'user': {
				const user = game.users.get(_animation.user);
				if (!user) {
					throw ErrorMsg.send('Can\'t find the assigned animatiions user?!'); // TODO: i18n
				}
				const userAnimations = user.getFlag('pf2e-graphics', 'animations') as UserAnimationSetDocument[];

				userAnimations.findSplice(el => el.id === _animation.id, _animation);

				await user.setFlag('pf2e-graphics', 'animations', userAnimations);
				break;
			}
			case 'world': {
				const store = window.pf2eGraphics.storeSettings.getWritableStore('globalAnimations')!;
				store.update((val: WorldAnimationSetDocument[]) => {
					val.findSplice(x => x.id === _animation.id);
					val.push(_animation);
					return val;
				});
				break;
			}
			default:
				log(`Edits have been ignored on read-only "${_animation.source}" type animation.`); // TODO: i18n
		}
	}

	override close(_options?: { force?: boolean }): Promise<void> {
		super.close(_options);
		const closing: Promise<void> = new Promise((resolve) => {
			try {
				resolve(this.save());
			} catch {}
		});
		return closing;
	}

	override _getHeaderButtons() {
		const buttons = super._getHeaderButtons();
		kofiButton(buttons);
		return buttons;
	}

	static getActiveApp() {
		return Object.values(ui.windows).find((app) => {
			return (
				app instanceof this && app.id === '' && app._state > Application.RENDER_STATES.CLOSED
			);
		});
	}

	static async show(options: Partial<BasicAppOptions>) {
		const existingApp = this.getActiveApp();
		if (existingApp) return existingApp.render(false, { focus: true });
		return new this(options).render(true, { focus: true });
	}
}

// Define the additional types outside the class
export type BasicAppExternal = SvelteApp.Context.External<AnimationDocumentApp>;

/** Extended options that you can define. */
export interface BasicAppOptions extends SvelteApp.Options {
	/** An example of defining additional options */
	animation: AnimationSetDocument;
	readonly: boolean;
	tab?: 'main' | 'json';
	jsonMode?: Mode;
}
