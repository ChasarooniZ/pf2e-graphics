import { pluralise } from './utils';

/**
 * Zod refinement to ensure a numeric value isn't zero.
 */
export const nonZero: [(num: number) => boolean, string] = [
	num => num !== 0,
	'Number cannot be 0. If you want the value to be 0, simply leave the property undefined.',
];

/**
 * Zod refinement to ensure an object has at least one property.
 */
export const nonEmpty = minimumProperties(1);

/**
 * Generator for a Zod refinement that ensures an object has at least `minimum` properties.
 */
export function minimumProperties(minimum: number): [(obj: object) => boolean, string] {
	return [
		(obj) => {
			let count = 0;
			for (const _key in obj) {
				if (++count === minimum) return true;
			}
			return false;
		},
		`Object must have at least ${minimum} ${pluralise('property', minimum)}.`,
	];
}

/**
 * Zod refinement to ensure an array has no duplicate elements (not perfect, but good enough).
 */
export const uniqueItems: [(arr: any[]) => boolean, string] = [
	arr => new Set(arr.map(e => JSON.stringify(e))).size === arr.length,
	'Items must be unique.',
];
