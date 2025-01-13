import { z } from 'zod';
import { ID, predicate, rollOption, UUID } from './helpers/atoms';
import { nonEmpty, uniqueItems } from './helpers/refinements';
import { pluralise } from './helpers/utils';
import { animationPayload } from './payloads/animation';
import { crosshairPayload } from './payloads/crosshair';
import { graphicPayload } from './payloads/graphic';
import { soundPayload } from './payloads/sound';
import { trigger } from './triggers';

/**
 * Zod schema for a `macro`-type payload.
 */
const macroPayload = z.object({
	type: z.literal('macro'),
	document: UUID.describe('The UUID of the macro to be executed.'),
	everyoneExecutes: z
		.literal(true)
		.optional()
		.describe(
			'By default, only the triggering user executes the macro. If you\'d like every logged-in user to execute the macro, enable this option.',
		),
	options: z
		.object({})
		.optional()
		.describe(
			'An arbitrary object of options you can pass into the macro as an argument. The following properties are always available unless overwritten:\n- `sources`: an array of token objects that triggered the payload.\n- `targets`: an array of token objects targetted by the triggering `sources`.\n- `templates`: an array of template objects associated with the trigger.\n- `user`: the user ID (string) for the triggering user.\n- `item`: the item object containing the triggered roll option (if any).\n- `currentIndex`: in a set with multiple payloads, this is the number of the currently executing payload (starting from 0)',
		),
});

/**
 * Zod schema for the animation-set payload that actually gets executed.
 */
const payload = z
	.discriminatedUnion('type', [
		animationPayload.strict(),
		crosshairPayload.strict(),
		graphicPayload.strict(),
		macroPayload.strict(),
		soundPayload.strict(),
	])
	.superRefine((obj, ctx) => {
		if (obj.type === 'crosshair') {
			if (obj.template?.type === 'token' && obj.snap) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [...ctx.path, 'snap'],
					message:
						'Setting the template type to `token` automatically configures the snapping behaviour. Overwriting this is probably erroneous.',
				});
			}
			if (obj.snap?.direction) {
				if (obj.lockManualRotation) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [...ctx.path, 'lockManualRotation'],
						message:
							'Locking a template\'s direction (`lockManualRotation`) makes direction-snapping (`snap.direction`) redundant.',
					});
				}
				if (obj.location?.lockToEdgeDirection) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [...ctx.path, 'location', 'lockToEdgeDirection'],
						message:
							'`lockToEdgeDirection` forces a template\'s direction, making `snap.direction` redundant.',
					});
				}
			}
			if (obj.location?.lockToEdgeDirection) {
				if (obj.lockManualRotation) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [...ctx.path, 'lockManualRotation'],
						message:
							'`lockManualRotation` is redundant when the template\'s orientation is locked away from the placeable (`location.lockToEdgeDirection`).',
					});
				}
				if (obj.template && 'direction' in obj.template) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [...ctx.path, 'template', 'direction'],
						message:
							'There\'s no point setting an initial orientation (`template.direction`) when the template\'s orientation is dependent on its position (`location.lockToEdgeDirection`).',
					});
				}
			}
			if (obj.snap?.position && obj.location?.lockToEdge) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [...ctx.path, 'snap', 'position'],
					message:
						'Locking a crosshair to a placeable\'s edge (`lockToEdge`) makes position-snapping (`snap.position`) redundant.',
				});
			}
		} else if (obj.type === 'sound') {
			if (!obj.position) {
				const keysNeedingPosition = (
					[
						'radius',
						'constrainedByWalls',
						'noDistanceEasing',
						'alwaysForGMs',
						'baseEffect',
						'muffledEffect',
					] as const
				).filter(key => key in obj);
				if (keysNeedingPosition.length) {
					return ctx.addIssue({
						code: z.ZodIssueCode.unrecognized_keys,
						keys: keysNeedingPosition,
						message: `\`position\` is required for the following ${pluralise('key', keysNeedingPosition.length)}: \`${keysNeedingPosition.join('`, `')}\``,
					});
				}
			}
		}
	})
	.describe('The animation payload that actually gets executed.');

/**
 * The animation-set payload that actually gets executed.
 *
 * Consider using as `Extract<Payload, { type: '...' }>` to select specific members.
 */
export type Payload = z.infer<typeof payload>;

/**
 * Zod schema for the 'flat' form of an animation-set object, after all `contents` have been unrolled and merged appropriately.
 */
const flatAnimation = z
	.object({
		label: ID.optional().describe(
			'A `label` is an almost-unique, case-sensitive string that exists so that other entities can reference it, particularly when another payload `removes` it. There must be no unintentional collisions among every ID between *PF2e Graphics*, any extension modules you have enabled, and any custom animation sets in your world—make sure it\'s reasonably distinguished!',
		),
		reference: rollOption
			.optional()
			.describe(
				'Copies another roll option\'s animation(s) wholesale into this animation\'s `contents` array. Note that this will likely overrule most properties you define.\nInfinite loops are unadvised.',
			),
		triggers: z
			.array(trigger)
			.min(1)
			.refine(...uniqueItems)
			.optional()
			.describe(
				'An array of strings, where each element is a trigger on which to consider playing the animation.',
			),
		overrides: z
			.array(rollOption)
			.min(1)
			.refine(...uniqueItems)
			.optional()
			.describe(
				'An array of strings, where each element is a roll option which *PF2e Graphics* should ignore when this animation plays. Partial roll options are permitted to override entire groups (e.g. the `item:base:rapier` animation overriding `item:group` to prevent a generic sword animation from being played).',
			),
		removes: z
			.array(ID)
			.min(1)
			.refine(...uniqueItems)
			.optional()
			.describe(
				'An array of strings, where each element is the `name` of another animation set or payload. When this set is executed, each of the named payloads are interrupted and removed.',
			),
		predicates: z
			.array(predicate)
			.min(1)
			.refine(...uniqueItems)
			.optional()
			.describe(
				'An array of predicates as per the pf2e system. The animation will only be executed if the predicates apply.\nFor more information, see: https://github.com/foundryvtt/pf2e/wiki/Quickstart-guide-for-rule-elements#predicates',
			),
		execute: payload.optional().describe('The actual animation to be executed!'),
	})
	.strict();

/**
 * Zod schema for the definition of a `generic` animation set.
 */
const generic = z
	.discriminatedUnion('type', [
		z.object({ type: z.literal('slot') }).strict(),
		z
			.object({
				type: z.literal('add-on'),
				order: z
					.enum(['last'])
					.optional()
					.describe(
						'Determines where the generic animation is placed in the animation stack when it applies (default: `first`).',
					),
			})
			.strict(),
	])
	.optional()
	.describe(
		'An animation can be marked as \'generic\'. This means that it doesn\'t just describe one unique event, but rather a general occurrence that might occur in many contexts (such as Casting a Spell, or scoring a critical hit on a Strike).\nThere are two parts to generic animations.\n- First, on the receiving end, we have `type: "slot"` generics. This indicates that this animation is a vacant spot for that general occurrence; it does nothing on its own, but indicates a slot (!) that an `add-on` can fill.\n- `add-on` generics are the premade \'templates\' that are actually applied. An `add-on` either fills a `slot` with a matching `label`, or it\'s simply prepended/appended the an animation set whenever it applies if `label` is undefined. You can control the position the `add-on` is placed using `order`.',
	);

/**
 * The complete animation-set object, as is encoded in JSON.
 */
export type AnimationSet = z.infer<typeof flatAnimation> & {
	generic?: z.infer<typeof generic>;
	contents?: AnimationSetContentsItem[];
};

/**
 * The partial animation-set object that is permitted within the `contents` array. It is identical to `AnimationSet`, except with `default` included and every property made optional.
 */
export type AnimationSetContentsItem<K = Payload['type']> = Partial<
	Omit<z.infer<typeof flatAnimation>, 'execute'>
> & {
	default?: true;
	execute?: Partial<Extract<Payload, { type: K }>>;
	contents?: AnimationSetContentsItem[];
};

/**
 * Zod schema for the complete animation object, as is encoded in JSON, but with every property made optional. This is used for nesting within `contents`.
 */
const animationSetContentsItem: z.ZodType<AnimationSetContentsItem> = flatAnimation
	.omit({ execute: true })
	.partial()
	.extend({
		default: z
			.literal(true)
			.optional()
			.describe(
				'When no animation sets within the same `contents` depth would be executed due to a lack of matches in `predicates`, a set with `default: true` will be executed anyway. Conversely, if multiple sets at the same `contents` depth would be executed, a set with `default: true` will be ignored.\nThis is especially useful when you have one \'standard\' payload, with variants for particular edge-cases. For instance, changing the sound of a Strike depending on the target\'s traits, or more generally setting the default payload when certain module settings are enabled or disabled (e.g. persistence, quality).\nThe same effect can be achieved using combining logic in `predicates`; this property is just a convenience.',
			),
		execute: z
			.union([
				animationPayload.partial(),
				crosshairPayload.partial(),
				graphicPayload.partial(),
				macroPayload.partial(),
				soundPayload.partial(),
			])
			.optional(),
		contents: z
			.lazy(() =>
				z
					.array(animationSetContentsItem)
					.min(2)
					.refine(...uniqueItems),
			)
			.optional(),
	})
	.strict()
	.refine(...nonEmpty);

/**
 * Zod schema for the complete animation set, as is encoded in JSON.
 * @remarks This schema isn't refined for valid super-structure.
 */
const animationSet: z.ZodType<AnimationSet> = flatAnimation
	.extend({
		generic,
		contents: z
			.array(animationSetContentsItem)
			.min(2)
			.refine(...uniqueItems)
			.optional(),
	})
	.strict()
	.refine(...nonEmpty);

/**
 * Zod schema for an array of animation sets, as applied to a single roll option.
 */
export const animationSets = z
	.array(animationSet)
	.min(1)
	// TODO: .superRefine((arr, ctx) => superValidate(arr, ctx))
	.refine(...uniqueItems);

/**
 * Zod schema for the data object mapping roll options to animation sets (or other roll options).
 */
export const animationSetsObject = z.record(rollOption, rollOption.or(animationSets));

/**
 * The data object mapping roll options to animation sets (or other roll options).
 */
export type AnimationSetsObject = z.infer<typeof animationSetsObject>;
