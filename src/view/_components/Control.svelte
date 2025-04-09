<script lang='ts'>
	export let title = 'Control Title';
	export let explain = 'Explainer';
</script>

<label class='grid grid-cols-3 items-center'>
	<span class='flex items-center' data-tooltip={explain}>
		{title}
		<i class='fa fa-info-circle px-2 ml-auto'></i>
	</span>
	<div class='flex align-middle items-center col-span-2'>
		<slot></slot>
	</div>
</label>
