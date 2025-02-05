<script lang='ts'>
	import type { AnimationSetContentsItem } from 'schema/payload';
	import FadedWrapper from 'src/view/_components/FadedWrapper.svelte';

	export let data: AnimationSetContentsItem<'graphic'>;
	export let readonly: boolean;

	// @ts-expect-error TODO: Sequencer Types
	const entries: string[] = window.Sequencer.Database.publicFlattenedSimpleEntries;

	let positionType: 'static' | 'dynamic' = 'static';
	let size: 'absolute' | 'relative' | 'directed' | 'screenSpace' = 'relative';

	let collapsed: number[] = [];

	for (let i = 0; i < (data.execute?.position?.length ?? 0); i++) {
		collapsed.push(i);
	}
</script>
{#if !data.execute}
	{#if !readonly}
		<p>
			<em>Attempted to render a 'graphic' execute section without an execute object present.</em>
		</p>
	{/if}
{:else}
	<div class='space-y-2'>
		<!-- #region Graphic -->
		{#if !data.execute.graphic}
			<!-- If wrong, don't! -->
			{(data.execute.graphic = []) && ''}
		{:else}
			<label class='grid grid-cols-3 items-center'>
				<span class='flex items-center' data-tooltip='TODO: Explain'>
					Graphic
					<i class='fa fa-info-circle px-2 ml-auto'></i>
				</span>
				<div class='flex align-middle items-center col-span-2'>
					<datalist id='graphic'>
						{#each entries as name}
							<option>{name}</option>
						{/each}
					</datalist>
					<input
						list='graphic'
						type='text'
						value={data.execute.graphic}
						on:change={(e) => {
							if (!data.execute) data.execute = {};
							if (e.currentTarget.value) {
								data.execute.graphic = [e.currentTarget.value];
							} else {
								data.execute.graphic = [];
							};
						}}
						{readonly}
						disabled={readonly}
					/>
				</div>
			</label>
		{/if}
		<!-- #region Persistent -->
		<label class='grid grid-cols-3 items-center'>
			<span class='flex items-center' data-tooltip='TODO: Explain'>
				Persistent
				<i class='fa fa-info-circle px-2 ml-auto'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<input
					disabled={readonly}
					type='checkbox'
					checked={Boolean(data.execute?.persistent)}
					on:change={(e) => {
						if (!data?.execute) return;
						if (e.currentTarget.checked) {
							data.execute.persistent = 'canvas';
						} else {
							delete data.execute.persistent;
						}
						data = data;
					}}
				/>
				{#if data.execute?.persistent}
					<select
						disabled={readonly || !data.execute.persistent}
						bind:value={data.execute.persistent}
					>
						<option value='canvas'>Canvas</option>
						<option value='tokenPrototype'>Token Prototype</option>
					</select>
				{/if}
			</div>
		</label>
		<!-- #endregion -->
		<!-- #region Tie To Documents -->
		<label class='grid grid-cols-3 items-center'>
			<span class='flex items-center' data-tooltip='TODO: Explain'>
				Tie To Documents
				<i class='fa fa-info-circle px-2 ml-auto'></i>
			</span>
			<div class='flex align-middle items-center col-span-2'>
				<input
					disabled={readonly}
					{readonly}
					bind:checked={data.execute.tieToDocuments}
					type='checkbox'
				/>
			</div>
		</label>
		<!-- #endregion -->
		{#if !data.execute.position}
			<!-- If wrong, don't! -->
			{(data.execute.position = []) && ''}
		{:else}
			<FadedWrapper>
				<label class='grid grid-cols-3 items-center'>
					<span class='flex items-center' data-tooltip='TODO: Explain'>
						Starting Position
						<i class='fa fa-info-circle px-2 ml-auto'></i>
					</span>
					<div class='flex align-middle items-center col-span-2'>
						<select disabled={readonly} bind:value={positionType} class='grow h-8 capitalize'>
							{#each ['static', 'dynamic'] as section}
								<option value={section}>{section}</option>
							{/each}
						</select>
						<button
							disabled={readonly}
							class='w-min text-nowrap h-8'
							on:click={() => {
								if (!data.execute || !data.execute.position) return;
								data.execute.position.push({
									type: positionType,
									location: 'SOURCES',
								});
								data = data;
							}}
						>
							<i class='fa fa-plus pr-1'></i>
							Add
						</button>
					</div>
				</label>
				{#each data.execute.position as position, index}
					{@const hidden = collapsed.includes(index)}
					<FadedWrapper>
						<header class='
							flex items-center gap-2
							border-solid border-0 {hidden ? '' : 'border-b pb-1'}
						'>
							<button class='size-min mr-auto' on:click={() => {
								if (!hidden) {
									collapsed.push(index);
								} else {
									collapsed.findSplice(x => x === index);
								}
								collapsed = collapsed;
							}}>
								<i class='fa {hidden ? 'fa-chevron-down' : 'fa-chevron-up'} fa-fw p-0 m-0'></i>
							</button>
							<span class='text-lg'>
								Type: <i>{position.type}</i>
							</span>
							<button
								disabled={readonly}
								class='ml-auto size-min'
								on:click={() => {
									if (data.execute?.position)
										data.execute.position.splice(data.execute.position.indexOf(position), 1);
									data = data;
								}}
							>
								<i class='fa fa-trash fa-fw p-0 m-0'></i>
							</button>
						</header>
						{#if !hidden}
							{#if position.type !== 'screenSpace'}
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Location
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<datalist id='location'>
										<option>SOURCES</option>
										<option>TARGETS</option>
										<option>TEMPLATES</option>
									</datalist>
									<input
										class='col-span-2'
										list='location'
										type='text'
										bind:value={position.location}
										{readonly}
										disabled={readonly}
									/>
								</label>
							{/if}
							<!-- #region Static -->
							{#if position.type === 'static'}
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Move Towards
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='flex items-center gap-2 h-7 col-span-2'>
										<input
											type='checkbox'
											disabled={readonly}
											checked={Boolean(position.moveTowards)}
											on:change={(e) => {
												// TODO: Remove unnecessary typecheck in Svelte 5
												if (position.type !== 'static') return;
												if (e.currentTarget.checked) {
													position.moveTowards = { target: 'SOURCES' };
												} else {
													delete position.moveTowards;
													position = position;
												}
											}}
										/>
										{#if position.moveTowards}
											<select
												class='grow'
												bind:value={position.moveTowards.target}
												disabled={readonly}
											>
												{#each ['SOURCES', 'TARGETS', 'TEMPLATES'] as section}
													<option value={section}>
														{section.toLowerCase().capitalize()}
													</option>
												{/each}
											</select>
										{/if}
									</div>
								</label>
							{/if}
							<!-- #endregion -->
							{#if !position.offset}
								<!-- If wrong, don't! -->
								{(position.offset = { x: undefined, y: undefined }) && ''}
							{:else}
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Offset
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='grid grid-cols-2 gap-4 items-stretch col-span-2'>
										<label class='flex items-center gap-2'>
											X
											<input
												type='number'
												bind:value={position.offset.x}
												{readonly}
												disabled={readonly}
											/>
										</label>
										<label class='flex items-center gap-2'>
											Y
											<input
												type='number'
												bind:value={position.offset.y}
												{readonly}
												disabled={readonly}
											/>
										</label>
									</div>
								</label>
							{/if}

							{#if !position.anchor}
								<!-- If wrong, don't! -->
								{(position.anchor = { x: undefined, y: undefined }) && ''}
							{:else}
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Anchor
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='grid grid-cols-2 gap-4 items-stretch col-span-2'>
										<label class='flex items-center gap-2'>
											X
											<input
												type='number'
												bind:value={position.anchor.x}
												{readonly}
												disabled={readonly}
												placeholder='0.5'
											/>
										</label>
										<label class='flex items-center gap-2'>
											Y
											<input
												type='number'
												bind:value={position.anchor.y}
												{readonly}
												disabled={readonly}
												placeholder='0.5'
											/>
										</label>
									</div>
								</label>
							{/if}

							{#if position.type !== 'screenSpace'}
								<!-- Random Offset -->
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Random Offset
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='flex align-middle items-center col-span-2'>
										<input
											type='number'
											bind:value={position.randomOffset}
											{readonly}
											disabled={readonly}
										/>
									</div>
								</label>
								<!-- Grid Units -->
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Grid Units
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='flex align-middle items-center col-span-2'>
										<input
											type='checkbox'
											bind:checked={position.gridUnits}
											{readonly}
											disabled={readonly}
										/>
									</div>
								</label>
								<!-- Local -->
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Local
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='flex align-middle items-center col-span-2'>
										<input
											type='checkbox'
											bind:checked={position.local}
											{readonly}
											disabled={readonly}
										/>
									</div>
								</label>
								<!-- Missed -->
								<label class='grid grid-cols-3 items-center'>
									<span class='flex items-center' data-tooltip='TODO: Explain'>
										Missed
										<i class='fa fa-info-circle px-2 ml-auto'></i>
									</span>
									<div class='flex align-middle items-center col-span-2'>
										<input
											type='number'
											bind:value={position.missed}
											{readonly}
											disabled={readonly}
										/>
									</div>
								</label>
							{/if}
						{/if}
					</FadedWrapper>
				{/each}
			</FadedWrapper>
		{/if}
		<FadedWrapper>
			<label class='grid grid-cols-3 items-center'>
				<span class='flex items-center' data-tooltip='TODO: Explain'>
					Size / Direction
					<i class='fa fa-info-circle px-2 ml-auto'></i>
				</span>
				<div class='flex align-middle items-center col-span-2'>
					<select disabled={readonly || Boolean(data.execute.size)} bind:value={size} class='grow h-8 capitalize'>
						{#each ['absolute', 'relative', 'directed', 'screenSpace'] as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
					<button
						disabled={readonly}
						class='w-min text-nowrap h-8'
						on:click={() => {
							if (data.execute?.size) {
								if (!data.execute) return;
								delete data.execute.size;
								data = data;
							} else {
								// @ts-ignore-error Lacking typescript support in Svelte 4
								data.execute.size = { type: size };
								data = data;
							}
						}}
					>
						{#if data.execute.size}
							<i class='fa fa-trash fa-fw'></i>
						{:else}
							<i class='fa fa-plus fa-fw'></i>
						{/if}
					</button>
				</div>
			</label>
			{#if data.execute?.size?.type === 'relative'}
				<label class='grid grid-cols-3 items-center'>
					<span class='flex items-center' data-tooltip='TODO: Explain'>
						Relative To
						<i class='fa fa-info-circle px-2 ml-auto'></i>
					</span>
					<div class='flex align-middle items-center col-span-2'>
						<select
							disabled={readonly}
							class='grow h-8 capitalize'
							bind:value={data.execute.size.relativeTo}
						>
							{#each ['SOURCES', 'TARGETS'] as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
				</label>
				<label class='grid grid-cols-3 items-center'>
					<span class='flex items-center' data-tooltip='TODO: Explain'>
						Scaling
						<i class='fa fa-info-circle px-2 ml-auto'></i>
					</span>
					<div class='flex align-middle items-center col-span-2'>
						<input
							disabled={readonly}
							{readonly}
							type='number'
							bind:value={data.execute.size.scaling}
							min='0.1' step='0.1' placeholder='1'
							on:change={() => {
								if (data.execute
									&& data.execute?.size
									&& data.execute?.size?.type === 'relative'
									&& !data.execute.size?.scaling
								) {
									delete data.execute.size.scaling;
									data = data;
								}
							}}
						/>
					</div>
				</label>
			{/if}
			{#if data.execute?.size?.type === 'directed'}
				<label class='grid grid-cols-3 items-center'>
					<span class='flex items-center' data-tooltip='TODO: Explain'>
						Endpoint
						<i class='fa fa-info-circle px-2 ml-auto'></i>
					</span>
					<div class='flex align-middle items-center col-span-2'>
						<select
							disabled={readonly}
							class='grow h-8 capitalize'
							bind:value={data.execute.size.endpoint}
						>
							{#each ['SOURCES', 'TARGETS'] as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
				</label>
			{/if}
			{#if data.execute?.size?.type === 'screenSpace'}
				Unimplemented!
			{/if}
			{#if data.execute?.size?.type === 'absolute'}
				Unimplemented!
			{/if}
		</FadedWrapper>
	</div>
{/if}
