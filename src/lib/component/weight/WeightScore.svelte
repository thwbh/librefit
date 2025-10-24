<script lang="ts">
	import { display_date_format, getDateAsStr, parseStringAsDate } from '$lib/date';
	import type {
		CreateWeightTrackerEntryParams,
		NewWeightTracker,
		UpdateWeightTrackerEntryParams,
		WeightTarget,
		WeightTracker
	} from '$lib/api/gen';
	import { ModalDialog, ValidatedInput } from '@thwbh/veilchen';
	import NumberFlow from '@number-flow/svelte';
	import { differenceInDays } from 'date-fns';
	import { Shield, ShieldCheck, ShieldWarning } from 'phosphor-svelte';
	import { Plus } from 'phosphor-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		weightTracker?: NewWeightTracker | WeightTracker;
		lastWeightTracker?: WeightTracker;
		weightTarget: WeightTarget;
		onadd?: (params: CreateWeightTrackerEntryParams) => Promise<WeightTracker>;
		onedit?: (params: UpdateWeightTrackerEntryParams) => Promise<WeightTracker>;
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

	let dialog: HTMLDialogElement | undefined = $state();
	let currentEntry = $derived({ ...weightTracker });

	const show = () => {
		dialog?.show();
	};

	const set = async () => {
		if ('id' in currentEntry) {
			await onedit?.({
				trackerId: currentEntry.id,
				updatedEntry: currentEntry
			}).then((updatedEntry: WeightTracker) => (weightTracker = updatedEntry));
		} else {
			await onadd?.({
				newEntry: currentEntry
			}).then((newEntry: WeightTracker) => (weightTracker = newEntry));
		}
	};
</script>

<div class="stat">
	<div class="stat-figure">
		<button class="btn btn-primary w-16 h-16" aria-label="Set Weight" onclick={show}>
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
			<ShieldCheck size="20" class={'text-success'} />
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

<ModalDialog bind:dialog onconfirm={set}>
	{#snippet title()}
		<span> Set Weight </span>
		<span class="text-xs">
			Date: {getDateAsStr(new Date(), display_date_format)}
		</span>
	{/snippet}
	{#snippet content()}
		<fieldset class="fieldset rounded-box">
			<ValidatedInput
				bind:value={currentEntry.amount}
				label="Current Weight"
				type="number"
				unit="kg"
				errorInline={true}
				min={30}
				max={330}
			>
				Please enter a valid weight.
			</ValidatedInput>
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
