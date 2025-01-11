<script lang="ts">
	import type { RadioInputChoice } from '$lib/types';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { createEventDispatcher } from 'svelte';

	export let value: any;

	export let choices: Array<RadioInputChoice>;
	export let name = `${value}-radio`;
	export let label = undefined;
	export let flexDirection = 'flex-row';

	const dispatch = createEventDispatcher();

	const changeSelection = (e: any) => {
		dispatch('change', {
			selection: e.target.value
		});
	};
</script>

{#if label !== undefined}
	<p>{label}</p>
{/if}

<RadioGroup {flexDirection} class="rounded-container-token">
	{#each choices as choice}
		<RadioItem
			class="rounded-container-token"
			bind:group={value}
			value={choice.value}
			{name}
			on:change={changeSelection}
		>
			{choice.label}
		</RadioItem>
	{/each}
</RadioGroup>
