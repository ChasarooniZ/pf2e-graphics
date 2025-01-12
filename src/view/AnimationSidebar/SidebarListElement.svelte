<script lang='ts'>
	import type { AnimationSet } from 'schema';
	import type { AnimationSetDocument } from 'src/extensions';
	import type { Readable } from 'svelte/store';
	import { TJSContextMenu } from '@typhonjs-fvtt/standard/application/menu';
	import { i18n, info, warn } from 'src/utils';
	import { slide } from 'svelte/transition';
	import AnimationDocumentApp from '../AnimationDocument/AnimationDocumentApp';
	import { copyAnimation, openAnimation, removeAnimation } from './sidebarFunctions';

	export let item: AnimationSetDocument;
	export let index: number;
	export let hidden: { global: Readable<string[]>; user: Readable<Record<string, string[]>>	};

	function moduleIDToName(id: string): string {
		const module = game.modules.get(id)!;
		return module.title ?? module.id;
	}

	function contextMenu(event: MouseEvent, animation: AnimationSetDocument) {
		const bounds = (event.currentTarget as HTMLElement)?.getBoundingClientRect();
		const coordinates = {
			y: Math.ceil(bounds.bottom + 1 || 0),
			x: Math.ceil(bounds.left + 1 || 0),
		};
		const disabledUserAnimations = game.user.getFlag('pf2e-graphics', 'disabledAnimations') as string[] || [];
		const disabledUser = disabledUserAnimations.includes(animation.rollOption);
		const disabledGlobalAnimations = window.pf2eGraphics.liveSettings.globalDisabledAnimations;
		const disabledGlobal = disabledGlobalAnimations.includes(animation.rollOption);

		const items = [
			{
				icon: 'fa fa-file-export',
				label: 'Export',
				onPress: async () => {
					let validated: string | AnimationSet[]; ;
					if (typeof item.animationSets !== 'string') {
						const result = await AnimationDocumentApp.validate(item);
						if (result.success) {
							validated = result.data;
						} else {
							validated = item.animationSets;
							warn(
								'The export animation failed the validation check! This may range from typos to malformed data. Check the console for more info.',
								{},
								{ data: result },
							); // TODO: i18n
						}
					} else {
						validated = item.animationSets;
					}
					const data = {
						...item,
						animationSets: validated,
					};
					window.saveDataToFile(
						JSON.stringify(data, null, '\t'),
						'text/json',
						`pf2e-graphics-${item.name}.json`,
					);
				},
			},
			{
				icon: 'fa fa-file-import',
				label: 'Import',
				onPress: () => {
				// TODO:
				},
			},
			{
				icon: 'fa fa-copy',
				label: 'Duplicate',
				onPress: () => copyAnimation(animation),
			},
			{
				icon: 'fa fa-eye-slash',
				label: disabledUser ? 'Enable' : 'Disable',
				onPress: () => {
					if (disabledUser) {
						game.user.setFlag(
							'pf2e-graphics',
							'disabledAnimations',
							disabledUserAnimations.filter(x => x !== animation.rollOption),
						).then(() => {
							// TODO: i18n
							info(`You will now see <code>${animation.rollOption}</code> animations.`);
						});
					} else {
						game.user.setFlag(
							'pf2e-graphics',
							'disabledAnimations',
							disabledUserAnimations.concat([animation.rollOption]),
						).then(() => {
							// TODO: i18n
							info(`You will no longer see <code>${animation.rollOption}</code> animations.`);
						});
					}
				},
			},
		];

		if (game.user.isGM) {
			items.push({
				icon: 'fa fa-ban',
				label: `${disabledGlobal ? 'Enable' : 'Disable'} for Everyone`,
				onPress: () => {
					if (disabledGlobal) {
						game.settings.set(
							'pf2e-graphics',
							'globalDisabledAnimations',
							disabledGlobalAnimations.filter(x => x !== animation.rollOption),
						).then(() => {
							// TODO: i18n
							info(`The <code>${animation.rollOption}</code> animations will no longer be displayed.`);
						});
					} else {
						game.settings.set(
							'pf2e-graphics',
							'globalDisabledAnimations',
							disabledGlobalAnimations.concat([animation.rollOption]),
						).then(() => {
							// TODO: i18n
							info(`The <code>${animation.rollOption}</code> animations will no longer be displayed.`);
						});
					}
				},
			});

			if (animation.source !== 'world') {
				items.push({
					icon: 'fa fa-arrow-up',
					label: 'Copy as World Animation',
					onPress: () => {
						const newAnim = { ...animation, source: 'world' } as AnimationSetDocument;
						copyAnimation(newAnim);
					},
				});
			}
		}

		if (animation.source !== 'module') {
			items.push({
				icon: 'fa fa-trash',
				label: 'Delete',
				onPress: () => removeAnimation(animation),
			});
		}

		TJSContextMenu.create({
			id: 'pf2e-g pf2e-graphics-context',
			event,
			...coordinates,
			styles: {
				width: `${Math.ceil(bounds.width + 1)}px`,
			},
			items,
		});
	}

	const { user, global } = hidden;
	$: users = Object.entries($user)
		.filter(x => x[1].includes(item.rollOption))
		.map(x => window.game.users.get(x[0])?.name)
		.join(', ');
	$: hiddenToYou = users.includes(game.user.name) || $global.includes(item.rollOption);
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<li
	transition:slide|global={{ duration: 500, delay: Math.max(0, 50 * Math.min(index, 10)) }}
	id='pf2e-g-{item.source}-{item.rollOption}'
	tabindex='-1'
	on:click={() => openAnimation(item)}
	on:contextmenu={event => contextMenu(event, item)}
	on:keydown={e => e.key === 'Enter' && openAnimation(item)}
	class='
		relative px-2
		hover:bg-slate-400/10
		active:bg-slate-400/20
		border-0 first:border-t border-b
		border-black border-solid
		text-left w-full
		{hiddenToYou ? 'text-white/50' : ''}
	'
>
	<aside class='absolute right-0 top-0 m-1'>
		{#if $global.includes(item.rollOption) && Object.values($user).flat().includes(item.rollOption)}
			<i data-tooltip={i18n('pf2e-graphics.disabled.both', { users })} class='fas fa-eye-slash'></i>
		{:else if $global.includes(item.rollOption)}
			<i data-tooltip={i18n('pf2e-graphics.disabled.global')} class='fas fa-eye-slash'></i>
		{:else if Object.values($user).flat().includes(item.rollOption)}
			<i data-tooltip={i18n('pf2e-graphics.disabled.users', { users })} class='fas fa-eye-slash'></i>
		{/if}
		{#if item.source === 'module'}
			{#if item.module === 'pf2e-graphics'}
				<i data-tooltip={i18n('pf2e-graphics.scopes.full.core')} class='fas fa-cube'></i>
			{:else}
				<span class='px-0.5 bg-black/40 rounded-sm border-solid border border-black'>
					{moduleIDToName(item.module)}
				</span>
				<i
					data-tooltip={i18n('pf2e-graphics.scopes.full.module')}
					class='fas fa-cubes'
				></i>
			{/if}
		{:else if item.source === 'user'}
			<span class='px-0.5 bg-black/40 rounded-sm border-solid border border-black'>
				{window.game.users.get(item.user)?.name ?? `<i>${i18n('pf2e-graphics.sidebar.animationSets.list.unknownUser')}</i>`}
			</span>
			<i data-tooltip={i18n('pf2e-graphics.scopes.full.user')} class='fas fa-user pl-0.5'></i>
		{:else if item.source === 'world'}
			<i data-tooltip={i18n('pf2e-graphics.scopes.full.world')} class='fas fa-globe'></i>
		{/if}
	</aside>

	<header class='leading-[3rem]'>
		{item.name}
		<span class='text-xs align-sub'>
			{#if !item.animationSets || !item.animationSets.length}
				<i>{i18n('pf2e-graphics.sidebar.animationSets.list.empty')}</i>
			{/if}
		</span>
	</header>

	{#if typeof item.animationSets === 'string'}
		<footer class='
			absolute right-0 bottom-0
			text-[0.6rem]
			bg-black/40 rounded-sm border-solid border border-black
			px-1 m-0.5
		'>
			{@html i18n('pf2e-graphics.sidebar.animationSets.list.alias', {
				rollOption: item.animationSets,
			})}
		</footer>
	{/if}
</li>
