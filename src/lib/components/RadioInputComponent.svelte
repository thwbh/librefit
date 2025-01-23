<script lang="ts">
	import type { RadioInputChoice } from '$lib/types';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

	interface Props {
		value: any;
		choices: Array<RadioInputChoice>;
		name?: any;
		label?: any;
		flexDirection?: string;
		onRadioSelected?: (value: string) => void;
	}

	let {
		value = $bindable(),
		choices,
		name = `${value}-radio`,
		label = undefined,
		flexDirection = 'flex-row',
		onRadioSelected = (_) => {}
	}: Props = $props();
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
			on:change={(event: any) => onRadioSelected(event.target.value)}
		>
			{choice.label}
		</RadioItem>
	{/each}
</RadioGroup>
