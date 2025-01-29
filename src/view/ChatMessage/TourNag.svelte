<script lang='ts'>
	import type { ChatMessagePF2e } from 'foundry-pf2e';

	export let message: ChatMessagePF2e;
	const { unstartedTourConfigs } = message.flags['pf2e-graphics'] as { unstartedTourConfigs: TourConfig[] };
</script>

<h2>Welcome to <i>PF2e Graphics</i>!</h2>
<p>Do you want a tour? :)</p>
<ul>
	{#each unstartedTourConfigs as tour}
		<li>Yes! I want to learn about: <code>{tour.id}</code></li>
	{/each}
</ul>
<hr />
<ul>
	<li><b>Never speak to me again >:(</b></li>
</ul>
