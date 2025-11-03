<script lang="ts">
	import { display_date_format, getDateAsStr, parseStringAsDate } from '$lib/date';
	import type { NewWeightTracker, WeightTarget, WeightTracker } from '$lib/api/gen';
	import { ModalDialog, NumberStepper } from '@thwbh/veilchen';
	import NumberFlow from '@number-flow/svelte';
	import { differenceInDays } from 'date-fns';
	import { Shield, ShieldCheck, ShieldWarning } from 'phosphor-svelte';
	import { Plus } from 'phosphor-svelte';
	import { goto } from '$app/navigation';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';

	interface Props {
		weightTracker?: NewWeightTracker | WeightTracker;
		lastWeightTracker?: WeightTracker;
		weightTarget: WeightTarget;
		onadd?: (entry: NewWeightTracker) => Promise<WeightTracker>;
		onedit?: (id: number, entry: WeightTracker) => Promise<WeightTracker>;
	}

	let {
		lastWeightTracker = undefined,
		weightTracker = {
			added: getDateAsStr(new Date()),
			amount: lastWeightTracker ? lastWeightTracker.amount : 0
		},

		weightTarget,
		onadd = undefined,
		onedit = undefined
	}: Props = $props();

	const modal = useEntryModal<WeightTracker, NewWeightTracker>({
		onCreate: async (entry) => {
			if (!onadd) throw new Error('No create handler provided');
			return await onadd(entry);
		},
		onUpdate: async (id, entry) => {
			if (!onedit) throw new Error('No update handler provided');
			return await onedit(id, entry);
		},
		onDelete: async (id) => {
			throw new Error('Delete not supported for weight entries');
		},
		getBlankEntry: () => ({
			added: getDateAsStr(new Date()),
			amount: lastWeightTracker ? lastWeightTracker.amount : 0
		}),
		onCreateSuccess: (newEntry) => {
			lastWeightTracker = newEntry;
		},
		onUpdateSuccess: (entry) => {
			lastWeightTracker = entry;
		}
	});
</script>

<div class="stat">
	<div class="stat-figure">
		<button class="btn btn-primary w-16 h-16" aria-label="Set Weight" onclick={modal.openCreate}>
			<Plus size="1.5rem" />
		</button>
	</div>

	<div class="stat-title">Current Weight</div>
	<div class="stat-value">
		<span>
			{#if (weightTracker && 'id' in weightTracker) || lastWeightTracker}
				{#if weightTracker && 'id' in weightTracker}
					<NumberFlow value={weightTracker.amount} />
				{:else if lastWeightTracker}
					<NumberFlow value={lastWeightTracker.amount} />
				{/if}
			{:else}
				-
			{/if}
			<span class="text-sm">kg</span>
		</span>
	</div>
	<div class="stat-desc flex items-center gap-1">
		{#if weightTracker && 'id' in weightTracker}
			<ShieldCheck size="20" weight="fill" class={'text-success'} />
			Last update: Today.
		{:else if lastWeightTracker}
			{@const lastEntryDayDiff = differenceInDays(
				new Date(),
				parseStringAsDate(lastWeightTracker.added)
			)}
			{#if lastEntryDayDiff > 2}
				<ShieldWarning size="1.5em" weight="fill" color={'var(--color-error)'} />
				Last update was {lastEntryDayDiff} days ago!
			{:else}
				<Shield size="1.5em" weight="fill" color={'var(--color-warning)'} />
				Last update: {lastEntryDayDiff} days ago.
			{/if}
		{:else}
			<Shield size="20" class={'stat-desc'} />
			Nothing tracked yet.
		{/if}
	</div>
</div>

<div class="progress-container w-full">
	<span class="flex flex-row justify-between items-center">
		{#if weightTarget}
			<p class="text-sm opacity-60">
				{differenceInDays(parseStringAsDate(weightTarget.endDate), new Date())} days left.
			</p>
			<button class="btn btn-sm" onclick={() => goto('/progress')}> Review plan </button>
		{/if}
	</span>
	<progress class="progress w-full" value="63" max="100"></progress>
</div>

<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span> Set Weight </span>
		<span class="text-xs">
			Date: {getDateAsStr(new Date(), display_date_format)}
		</span>
	{/snippet}
	{#snippet content()}
		<fieldset class="fieldset rounded-box">
			{#if modal.errorMessage}
				<div class="alert alert-error mb-4">
					<span>{modal.errorMessage}</span>
				</div>
			{/if}
			{#if modal.currentEntry}
				<NumberStepper
					bind:value={modal.currentEntry.amount}
					label="Current Weight"
					unit="kg"
					min={30}
					max={330}
					incrementSteps={[0.5, 1, 2, 5]}
					decrementSteps={[0.5, 1, 2, 5]}
					initialIncrementStep={1}
					initialDecrementStep={1}
				/>
			{/if}
		</fieldset>
	{/snippet}
</ModalDialog>

<style>
	.stat-value {
		font-size: 2rem;
	}

	.progress-container {
		padding-inline: calc(0.25rem * 6);
		padding-block: calc(0.25rem * 4);
	}
</style>
