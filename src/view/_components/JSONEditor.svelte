<script lang='ts'>
	import type { Mode, ValidationError } from 'svelte-jsoneditor';
	import { dev } from 'src/utils';
	import { ValidationSeverity } from 'svelte-jsoneditor';
	import { fromZodIssue } from 'zod-validation-error';

	export let json: object;
	export let mode: Mode = 'text' as Mode;

	async function validatorFactory(): Promise<(x: unknown) => ValidationError[]> {
		const module = await import('schema/validation');
		return (json: unknown): ValidationError[] => {
			const result = module.validateAnimationData(json);
			if (result.success) return [];
			return result.error.issues.map(issue => ({
				path: issue.path.map(piece => piece.toString()),
				message: fromZodIssue(issue, { prefix: null, includePath: false }).toString(),
				severity: ValidationSeverity.error,
			}));
		};
	}
</script>

<section class='pf2e-g'>
	{#await import('svelte-jsoneditor')}
		Waiting for extra JSONEditor code...
	{:then Module}
		{#if dev}
			{#await validatorFactory() then validator}
				<Module.JSONEditor
					content={{ json }}
					readOnly={true}
					{mode}
					{validator}
					navigationBar={false}
					statusBar={false}
					indentation='	'
					tabSize={2}
				/>
			{/await}
		{:else}
			<Module.JSONEditor
				content={{ json }}
				readOnly={true}
				{mode}
				navigationBar={false}
				statusBar={false}
				indentation='	'
				tabSize={2}
			/>
		{/if}
	{/await}
</section>
