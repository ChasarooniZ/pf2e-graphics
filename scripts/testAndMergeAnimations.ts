import type { ModuleDataObject } from '../schema/index.ts';
import type { AnimationSet, AnimationSetsObject } from '../schema/payload.ts';
import type { FileValidationFailure } from './helpers.ts';
import * as fs from 'node:fs';
import { validateAnimationData } from '../schema/validation/index.ts';
import { pluralise, safeJSONParse, testFilesRecursively } from './helpers.ts';

/**
 * Tests animation JSONs, and then returns a merged object along with any valiation errors encountered.
 *
 * @param targetPath - The path of the animation JSON(s). If the path is a directory, all files within it recursively are tested and merged.
 * @returns An object.
 */
export function testAndMergeAnimations(
	targetPath: string,
):
	| { success: true; data: ModuleDataObject }
	| { success: false; data?: ModuleDataObject; issues: FileValidationFailure[] } {
	const referenceTracker = new (class ReferenceTracker extends Map<string, Set<string>> {
		constructor() {
			super();
		}

		private addPending(rollOption: string, file: string): void {
			if (this.has(rollOption)) {
				this.get(rollOption)!.add(file);
			} else {
				this.set(rollOption, new Set([file]));
			}
		}

		populate(file: string, value: string | AnimationSet[]): void {
			if (typeof value === 'string') {
				this.addPending(value, file);
			} else {
				for (const obj of value) {
					if (obj.reference) this.addPending(obj.reference, file);
					for (const override of obj.overrides ?? []) {
						this.addPending(override, file);
					}
				}
			}
		}
	})();
	const mergedAnimations: Map<keyof ModuleDataObject, ValueOf<ModuleDataObject>> = new Map();

	const results = testFilesRecursively(
		targetPath,
		{
			'.json': (file) => {
				// Test filename
				if (!file.match(/animations[\\/](([a-z0-9-]+[\\/])+[a-z0-9]+(?:-[a-z0-9]+)*|tokenImages)\.json$/))
					return { file, success: false, message: 'Invalid filename.' };

				// Test readability
				const json = safeJSONParse(fs.readFileSync(file, { encoding: 'utf8' }));
				if (!json.success) return { file, success: false, message: 'Invalid JSON syntax.' };

				// Validate schema
				const schemaResult = validateAnimationData(json.data);

				// Test whether the data is an object and is therefore mergeable
				if (typeof json.data === 'object' && json.data !== null && !Array.isArray(json.data)) {
					const animations = json.data as AnimationSetsObject;
					for (const key in animations) {
						// Test for duplicate keys
						if (mergedAnimations.has(key)) {
							return {
								file,
								success: false,
								message: `Animation assigned elsewhere to roll option ${key}`,
							};
						} else {
							mergedAnimations.set(key, animations[key]);
						}

						// Populate referenced rollOptions for validation afterwards
						referenceTracker.populate(file, animations[key]);
					}
				}

				if (schemaResult.success) return { file, success: true };
				return {
					file,
					success: false,
					message: `${schemaResult.error.issues.length} schema ${pluralise('issue', schemaResult.error.issues.length)}`,
					issues: schemaResult.error.issues,
				};
			},
			'default': false,
		},
		{ ignoreGit: true },
	);

	const issues = results.filter(result => !result.success);

	/*
		Strings that can trip up the checker but are nonetheless valid,
		most often becuase they are most of, but not the entire, roll option for
		catching more cases. I.e. item:group: catching all base weapon groups

		TODO: @Spappz Move this elsewhere or tell me if you think making an uglify function
		for the mergedAnimations.keys() is preferable, i.e. ['item:group:club'] -> ['item:group', 'item:group:club']
	*/
	const validExclusions = ['item:group'];

	// Test references
	referenceTracker.forEach((files, rollOption) => {
		if (!mergedAnimations.has(rollOption) && !validExclusions.includes(rollOption)) {
			files.forEach(file =>
				issues.push({
					file,
					success: false,
					message: `Could not find referenced roll option ${rollOption}`,
				}),
			);
		}
	});

	const data = mergedAnimations.size ? Object.fromEntries(mergedAnimations) : undefined;

	if (issues.length) return { success: false, data, issues };
	return { success: true, data: data! };
}
