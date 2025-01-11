import type { AnimationSetDocument, ModuleAnimationSetDocument, UserAnimationSetDocument, WorldAnimationSetDocument } from 'src/extensions';
import type { Readable } from 'svelte/store';
import { TJSDocument } from '@typhonjs-fvtt/runtime/svelte/store/fvtt/document';
import { deslugify } from 'src/utils';
import { derived } from 'svelte/store';

const ignoredWords = ['item:slug:'];

export function initVariables(): {
	animations: Readable<AnimationSetDocument[]>;
	userDisabled: Readable<Record<string, string[]>>;
} {
	const userDocs = game.users.map(x => new TJSDocument(x));
	const users: Readable<UserAnimationSetDocument[]> = derived(userDocs, $userDocs =>
		$userDocs.flatMap(user =>
			(
				(user.getFlag('pf2e-graphics', 'animations') ?? []) as Extract<
					AnimationSetDocument,
					{ source: 'user' }
				>[]
			).map(anim => ({
				...anim,
				source: 'user' as const,
				user: user.id,
			})),
		));

	const module: Readable<ModuleAnimationSetDocument[]> = derived(
		window.pf2eGraphics.AnimCore.animationsStore,
		$animations =>
			Array.from($animations.entries()).map(([rollOption, data]) => ({
				source: 'module' as const,
				module: data.module,
				name: deslugify(rollOption.replace(new RegExp(ignoredWords.join('|'), 'g'), '')),
				rollOption,
				animationSets: data.animationSets,
			})),
	);

	const world: Readable<WorldAnimationSetDocument[]> = window.pf2eGraphics.storeSettings.getReadableStore('globalAnimations')!;

	return {
		animations: derived(
			[users, module, world],
			([$users, $module, $world]) => [...$users, ...$world, ...$module],
		),
		userDisabled: derived(
			userDocs,
			($userDocs) => {
				const obj: Record<string, string[]> = {};
				for (const userDoc of $userDocs) {
					obj[userDoc.id] = userDoc.getFlag('pf2e-graphics', 'disabledAnimations') as string[] || [];
				}
				return obj;
			},
		),
	};
}
