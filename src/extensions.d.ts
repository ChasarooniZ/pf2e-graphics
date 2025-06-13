import type { SvelteApplicationOptions } from '@typhonjs-fvtt/runtime/svelte/application';
import type { TJSSessionStorage } from '@typhonjs-fvtt/runtime/svelte/store/web-storage';
import type { Writable } from 'svelte/store';
import type { ModuleDataObject } from '../schema';
import type { LiveSettings, StoreSettings } from './settings';
import type { AnimationHistoryObject, AnimCore } from './storage/AnimCore';

export type CombinedSvelteApplicationOptions = ApplicationOptions & SvelteApplicationOptions;

export type ConstructorApplicationOptions = Partial<CombinedSvelteApplicationOptions>;

export interface ExternalTJSContext {
	application: Application;
	elementRootUpdate: () => void;
	sessionStorage: TJSSessionStorage;
}

interface Context {
	'#external': ExternalTJSContext;
}

declare module 'svelte' {
	export function getContext<T extends keyof Context, K extends Context[T]>(key: T): K;
	export function setContext<T extends keyof Context, K extends Context[T]>(key: T, context: K): void;
}

export type TokenOrDoc = TokenDocument | Token;

type Entries<T, K extends keyof T = keyof T> = (K extends unknown ? [K, T[K]] : never)[];

export type moduleFlags
	= | undefined
		| {
			customAnimations?: ModuleDataObject;
		};

declare global {
	interface pf2eGraphics {
		socket: SocketlibSocket;
		modules: Writable<Map<string, ModuleDataObject>>;
		AnimCore: InstanceType<typeof AnimCore>;
		liveSettings: LiveSettings;
		storeSettings: StoreSettings;
		history: Writable<AnimationHistoryObject[]>;
		locations: Writable<{ name: string; location: object }[]>;
	}

	class TextureTransitionFilter extends AbstractBaseFilter {
		/** Transition types for this shader. */
		static get TYPES(): {
			FADE: 'fade';
			SWIRL: 'swirl';
			WATER_DROP: 'waterDrop';
			MORPH: 'morph';
			CROSSHATCH: 'crosshatch';
			WIND: 'wind';
			WAVES: 'waves';
			WHITE_NOISE: 'whiteNoise';
			HOLOGRAM: 'hologram';
			HOLE: 'hole';
			HOLE_SWIRL: 'holeSwirl';
			GLITCH: 'glitch';
			DOTS: 'dots';
			[k: string]: string;
		};
	}

	class CanvasAnimation {}
	class ImageHelper {
		static createThumbnail(src, { width, height }): Promise<{ src; thumb }>;
	}

	interface Window {
		saveDataToFile;
		CanvasAnimation;
		ImagePopout;
		TextureTransitionFilter: typeof TextureTransitionFilter;
		pf2eGraphics: pf2eGraphics;
	}
}

/**
 * The nullable interface stored on an actor's module flags to define its tokens' effective size.
 */
export type EffectiveSize
	= | undefined
		| {
			enabled: boolean;
			size: number;
		};
