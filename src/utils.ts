/* eslint-disable no-prototype-builtins */

import type { SvelteApp } from '@typhonjs-fvtt/runtime/svelte/application';
import type { ActorPF2e, UserPF2e } from 'foundry-pf2e';

/* eslint-disable no-console */

interface NotifyOptions {
	/** Should the notification be permanently displayed until dismissed */
	permanent?: boolean;
	/** to localize the message content before displaying it */
	localize?: boolean;
	/** Whether to log the message to the console */
	console?: boolean;
	/** Extra data to send to the console. */
	data?: unknown;
}

/**
 * A convenient wrapper around the `Error` class to handle internationalisation and formatting.
 *
 * Use `new ErrorMsg()` to simply generate the `Error` object. Use the static method `ErrorMsg.send()` to generate the error object *and* emit an error notification in Foundry's UI.
 *
 * TODO: (Fall Cleaning) Move to $lib
 */
export class ErrorMsg extends Error {
	constructor(message: string, format?: Record<string, string>, options?: ErrorOptions) {
		super(HTMLToMarkdown(`PF2e Graphics | ${i18n(message, format)}`), options);
	}

	/**
	 * Creates an `Error`, formats its data, and emits it to Foundry's UI via a toast notification. Use with `throw` to break the workflow and also write the error to the console.
	 * @param message The error message to be thrown. Accepts both localisation and literal strings.
	 * @param format Handlebars formatting object. For instance, `message: "Hello {name}!"` and `format: { name: "Monsieur Vauxs" }` returns a string of `"Hello Monsieur Vauxs!"`.
	 * @returns An `Error` object.
	 */
	static send(message: string, format?: Record<string, string>, options?: ErrorOptions & NotifyOptions) {
		const err = new this(message, format, options);
		ui.notifications.error(`<b>PF2e Graphics</b> | ${i18n(message, format)}`, options);
		return err;
	}
}

/**
 * Converts a limited form of inline HTML formatting to markdown (e.g. `<b>` → `**`). Primarily used for outputting readable messages to the console while having them still look pretty for Foundry `ui.notifications` calls.
 * @param str The input HTML-formatted string.
 * @returns A string reformatted as markdown.
 */
export function HTMLToMarkdown(str: string): string {
	return str
		.replace(/<\/?(?:code|kbd|samp|var)>/gi, '`')
		.replace(/<\/?(?:i|em)>/gi, '_')
		.replace(/<\/?(?:b|strong)>/gi, '**')
		.replace(/<\/?(?:u|ins)>/gi, '__')
		.replace(/<\/?(?:s(?:trike)?|del)/gi, '~~');
}

/**
 * Converts type `T[]` to `T`.
 */
export type ArrayElement<T extends readonly any[]> = T extends readonly (infer U)[] ? U : never;

export function nonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}

export const dev = import.meta.env.DEV;

/** Fires `console.log()` with some extra formatting sugar if and only if `dev` mode is enabled. */
export function devLog(...args: any) {
	if (dev) console.log(`[%cPF2e Graphics%c %cDEV%c]`, 'color: yellow', '', 'color: #20C20E;', '', ...args);
}

/** Fires `console.log()` with some formatting sugar TODO: NOT if and only if `dev` mode is enabled. */
export function log(...args: any) {
	if (dev) console.log(`[%cPF2e Graphics%c]`, 'color: yellow', '', ...args);
}

/** Fires `ui.notifications.info()` but with the module name prepended. I18n is always called in `message`. */
export function info(message: string, format?: Record<string, string>, options?: NotifyOptions) {
	const i18nedMessage = `<b>PF2e Graphics</b> | ${i18n(message, format)}`;
	ui.notifications.info(i18nedMessage, { ...options, console: false });
	if (options?.console !== false) console.info(HTMLToMarkdown(i18nedMessage), options?.data ?? ' ');
}

/** Fires `ui.notifications.warn()` but with the module name prepended. I18n is always called in `message`. */
export function warn(message: string, format?: Record<string, string>, options?: NotifyOptions) {
	const i18nedMessage = `<b>PF2e Graphics</b> | ${i18n(message, format)}`;
	ui.notifications.warn(i18nedMessage, { ...options, console: false });
	if (options?.console !== false) console.warn(HTMLToMarkdown(i18nedMessage), options?.data ?? ' ');
}

/** Fires `ui.notifications.error()` but with the module name prepended. I18n is always called in `message`. */
export function error(message: string, format?: Record<string, string>, options?: NotifyOptions & ErrorOptions) {
	const i18nedMessage = `<b>PF2e Graphics</b> | ${i18n(message, format)}`;
	ui.notifications.error(i18nedMessage, { ...options, console: false });
	if (options?.console !== false)
		console.error(HTMLToMarkdown(i18nedMessage), options?.data ?? ' ', options?.cause ?? ' ');
}

export function i18n(code: string, format?: Record<string, string>) {
	if (code.startsWith('pf2e-graphics')) return game.i18n.format(code, format);

	if (game.i18n.format(code, format) !== code) return game.i18n.format(code, format);

	const test = `pf2e-graphics.${code}`;
	if (game.i18n.format(test, format) !== test) {
		console.warn(`[%cPF2e Graphics%c]`, 'color: yellow', '', 'Missing prefix on:', code);
		return game.i18n.format(test, format);
	}

	console.error(`[%cPF2e Graphics%c]`, 'color: yellow', '', 'Failed to run i18n on:', code);
	return code;
}

/**
 * Returns `true` if the the input object `obj` has at least one property.
 * @privateRemarks Duplicated from `schema/helpers/refinements.ts`.
 */
export function nonEmpty(obj: { [K: string]: any }): boolean {
	for (const _key in obj) {
		if (obj[_key] !== undefined) return true; // This is simply most performant ¯\_(ツ)_/¯
	}
	return false;
}

/**
 * Returns `true` if the input object `obj` has exactly zero properties.
 */
export function isEmpty(obj: Parameters<typeof nonEmpty>[0]) {
	return !nonEmpty(obj);
}

/**
 * Returns `true` if the `val` is: `true`, a number, or a non-empty string, object, or array. Returns `false` otherwise (i.e. `null`, `undefined`, and empty strings, objects, or arrays).
 */
export function isTrueish<T>(val: T): val is NonNullable<T> {
	return (
		nonNullable(val)
		&& Boolean(val)
		&& (typeof val === 'object' ? nonEmpty(val) : true)
		&& (Array.isArray(val) ? val.length !== 0 : true)
	);
}

export function findTokenByActor(actor?: ActorPF2e | null) {
	return canvas.tokens.getDocuments().find(x => x.actor?.id === actor?.id);
}

export function dedupeStrings(array: string[]) {
	return Array.from(new Set(array));
}

export function getPlayerOwners(actor: ActorPF2e): UserPF2e[] {
	const assigned = game.users.contents.find(user => user.character?.id === actor.id);
	if (assigned) return [assigned];

	// If everyone owns it, nobody does.
	if (actor.ownership.default === 3) {
		return game.users.contents;
	}

	// Check the ownership IDs, check if there is a player owner, yes, ignore GMs, no, count only GMs.
	const owners = Object.keys(actor.ownership)
		.filter(x => x !== 'default')
		.filter(x =>
			actor.hasPlayerOwner
				? !game.users.get(x)?.hasRole('GAMEMASTER')
				: game.users.get(x)?.hasRole('GAMEMASTER'),
		)
		.map(x => game.users.get(x))
		.filter(nonNullable);

	if (owners.length) {
		return owners;
	} else {
		// If "nobody" owns it, whoever is the primaryUpdater (read: GM) does.
		// This should handle weirdos like { ownership: { default: 0 } }
		if (actor.primaryUpdater) {
			log('Could not determine owner, defaulting to primaryUpdater.');
			return [actor.primaryUpdater];
		} else {
			log('Could not determine owner nor found the primaryUpdater, defaulting to all GMs.');
			return game.users.filter(x => x.isGM);
		}
	}
}

export function clearEmpties<T extends Record<string, any>>(o: T): T & Record<string, Exclude<any, undefined>> {
	for (const k in o) {
		if (Array.isArray(o[k])) {
			o[k] = o[k].map(clearEmpties).filter((x: any) => !!x);
		} else if (!o[k] || typeof o[k] !== 'object') {
			continue; // If null or not an object, skip to the next iteration
		}

		// The property is an object
		clearEmpties(o[k]); // <-- Make a recursive call on the nested object
		if (Object.keys(o[k]).length === 0) {
			delete o[k]; // The object had no properties, so delete that property
		}
	}
	return o;
}

type Primitive = string | number | boolean | null | undefined;
type Mergeable = Primitive | MergeableObject | MergeableArray;
type MergeableArray = Mergeable[];
interface MergeableObject {
	[key: string]: Mergeable;
}

export function mergeObjectsConcatArrays<T extends MergeableObject, U extends MergeableObject>(
	obj1: T,
	obj2: U,
): T & U {
	const result: any = {};

	for (const key in obj1) {
		if (obj1.hasOwnProperty(key)) {
			if (obj2.hasOwnProperty(key)) {
				const value1 = obj1[key];
				const value2 = obj2[key];

				if (Array.isArray(value1) && Array.isArray(value2)) {
					result[key] = value1.concat(value2);
				} else if (
					typeof value1 === 'object'
					&& typeof value2 === 'object'
					&& value1 !== null
					&& value2 !== null
				) {
					result[key] = mergeObjectsConcatArrays(value1 as MergeableObject, value2 as MergeableObject);
				} else {
					result[key] = value2;
				}
			} else {
				result[key] = obj1[key];
			}
		}
	}

	for (const key in obj2) {
		if (obj2.hasOwnProperty(key) && !result.hasOwnProperty(key)) {
			result[key] = obj2[key];
		}
	}

	return result as T & U;
}

/**
 * Prepends the Ko-fi donation button to an array of application header buttons.
 *
 * Note that the input array is modified directly:
 * ```ts
 * const a = [];
 * const b = kofiButton(a);
 * console.log(a === b); // true
 * ```
 * @param buttons An array of application header buttons.
 * @returns An array of application header buttons with the Ko-fi donation button in index `0`.
 */
export function kofiButton(buttons: SvelteApp.HeaderButton[]): SvelteApp.HeaderButton[] {
	buttons.unshift({
		icon: 'fas fa-mug-hot ko-fi',
		class: 'hover:underline',
		label: `pf2e-graphics.support.${Sequencer.Helpers.random_int_between(1, 6)}`,
		onclick: () => {
			window.open('https://ko-fi.com/mrvauxs', '_blank');
		},
	});
	return buttons;
}

/**
 * Moves an array index from one position to another.
 * Mutates the original array and returns the modified version.
 *
 * @param arr
 * @param {number} old_index
 * @param new_index
 * @returns array
 */
export function arrayMove<T>(arr: T[], old_index: number, new_index: number): T[] {
	if (new_index >= arr.length) {
		throw new Error('You are trying to push to an index beyond the array\'s size!');
	}
	arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
	return arr; // for testing
}

/**
 * Reverses the regularisation of the pf2e system's slug formatting. Notably, dashes are replaced with spaces, colons are right-padded with a space, and a naive title-capitalisation scheme is applied.
 * @example deslugify('foo-bah:1') // 'Foo Bah: 1'
 * @param string The input string.
 * @returns A title-cased, human-presentable string.
 */
export function deslugify(string: string) {
	return string
		.replaceAll(/-/g, ' ')
		.replaceAll(/:(\w)/g, ': $1')
		.split(' ')
		.map(x => x.charAt(0).toUpperCase() + x.slice(1))
		.join(' ');
}

/**
 * Converts a mechanical size into a numerical token size (in grid-squares).
 * @param size A string representing a size, as per the `pf2e` system.
 * @returns A number representing how big a token usually is for that particular size, in grid-squares.
 */
export function getDefaultSize(size: ActorPF2e['size'] | undefined): number {
	if (size === 'med') return 1;
	if (size === 'sm') return 0.8;
	if (size === 'lg') return 2;
	if (size === 'tiny') return 0.5;
	if (size === 'huge') return 3;
	if (size === 'grg') return 4;
	throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownSize', { size: size!.toString() });
}

/**
 * A data-valiation wrapper around `JSON.parse()` for when data is ingested from external sources.
 * @privateRemarks Copied from `scripts/helpers.ts`.
 * @param input The input string.
 * @returns An object with a `success` property indicating the success state. If `input` was parsed successfully, it is included in the `json` property.
 */
export function safeJSONParse(
	input: string,
): { success: true; data: ReturnType<JSON['parse']> } | { success: false } {
	try {
		return {
			success: true,
			data: JSON.parse(input),
		};
	} catch {
		return { success: false };
	}
}
