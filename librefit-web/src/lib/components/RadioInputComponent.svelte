<script lang="ts">
	import type { RadioInputChoice } from '$lib/types';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

	export let value: any;

	export let choices: Array<RadioInputChoice>;
	export let name = `${value}-radio`;
	export let label = 'Radio';
</script>

<p>{label}</p>

<RadioGroup>
	{#each choices as choice}
		<RadioItem bind:group={value} value={choice.value} {name}>
			{choice.label}
		</RadioItem>
	{/each}
</RadioGroup>
