<script lang="ts">
	import type { Intake } from '$lib/api/gen';
	import IntakeMask from './IntakeMask.svelte';
	import { AlertBox, AlertType, LongPressContainer, Stack, StackCard } from '@thwbh/veilchen';
	import { fade, type FlyParams } from 'svelte/transition';
	import { vibrate } from '@tauri-apps/plugin-haptics';
	import { getFoodCategoryColor } from '$lib/api';

	interface Props {
		index: number;
		entries: Array<Intake>;
		onEdit: (entry: Intake) => void;
		class?: string;
	}

	let {
		index = $bindable(),
		entries = $bindable([]),
		onEdit = () => {},
		class: className = ''
	}: Props = $props();

	// Use modal composition hook

	const onlongpress = async (cardKey: number) => {
		await vibrate(2);

		onEdit(entries[cardKey]);
	};
</script>

{#if entries.length > 0}
	<Stack
		bind:index
		size={entries.length}
		swipeable={true}
		onswipe={(direction: string) => console.log('swiped ', direction)}
		class={className}
	>
		{#snippet card(cardKey: number, outFlyParams: FlyParams, inFlyParams: FlyParams)}
			<StackCard
				isActive={cardKey === index}
				{cardKey}
				{outFlyParams}
				{inFlyParams}
				class="card-side w-full"
			>
				{#snippet side()}
					<figure class="{getFoodCategoryColor(entries[cardKey].category)} w-4"></figure>
				{/snippet}
				<LongPressContainer onlongpress={() => onlongpress(cardKey)}>
					<IntakeMask entry={entries[cardKey]} readonly />
				</LongPressContainer>
			</StackCard>
		{/snippet}
	</Stack>
{:else}
	<div in:fade>
		<AlertBox type={AlertType.Warning} class="border-neutral border-dashed">
			<strong>Nothing tracked today.</strong>
			<span> Use the button below to add today's first entry. Stay strong! </span>
		</AlertBox>
	</div>
{/if}

<!-- <button class="btn btn-neutral w-full" onclick={modal.openCreate}> Add Intake </button> -->
