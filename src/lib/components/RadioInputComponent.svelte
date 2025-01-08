<script lang="ts">
	import type { RadioInputChoice } from '$lib/types';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

	export let value: any;

	export let choices: Array<RadioInputChoice>;
	export let name = `${value}-radio`;
	export let label = undefined;
	export let flexDirection = 'flex-row';
</script>

{#if label !== undefined}
	<p>{label}</p>
{/if}

<RadioGroup {flexDirection} class="rounded-container-token">
	{#each choices as choice}
		<RadioItem class="rounded-container-token" bind:group={value} value={choice.value} {name}>
			{choice.label}
		</RadioItem>
	{/each}
</RadioGroup>
