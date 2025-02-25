<script lang="ts">
	import { getDaytimeFoodCategory } from '$lib/date';
	import TrackerButtons from './TrackerButtons.svelte';
	import type { FoodCategory } from '$lib/model';
	import type { TrackerInputDetails, TrackerInputEvent, TrackerButtonEvent } from '$lib/event';

	interface Props {
		value?: any;
		dateStr: string;
		id?: number | undefined;
		existing?: boolean;
		disabled?: boolean;
		compact?: boolean;
		categories?: Array<FoodCategory> | undefined;
		category?: string;
		unit: string;
		maxWidthCss?: string;
		placeholder?: string;
		onAdd?: (input: TrackerInputEvent<any>) => void;
		onUpdate?: (input: TrackerInputEvent<any>) => void;
		onDelete?: (input: TrackerInputEvent<any>) => void;
	}

	let {
		value = $bindable(),
		dateStr,
		id = undefined,
		existing = false,
		disabled = $bindable(false),
		compact = false,
		categories = undefined,
		category = $bindable(
			categories
				? categories.filter((c) => c.shortvalue === getDaytimeFoodCategory(new Date()))[0]
						.shortvalue
				: undefined
		),
		unit,
		maxWidthCss = '',
		placeholder = 'Amount...',
		onAdd,
		onUpdate,
		onDelete
	}: Props = $props();

	let previous: any = $state({ value: undefined, category: undefined });
	let changeAction = $state();

	const addCallback = (buttonEvent: TrackerButtonEvent) => {
		const details: TrackerInputDetails = {
			id: id,
			added: dateStr,
			amount: value,
			category: category
		};

		onAdd({ details, buttonEvent });
	};

	const updateCallback = (buttonEvent: TrackerButtonEvent) => {
		if (value !== previous.value || category !== previous.category) {
			onUpdate({
				details: {
					id: id,
					added: dateStr,
					amount: value,
					category: category
				},

				buttonEvent
			});
		}
	};

	const deleteCallback = (buttonEvent: TrackerButtonEvent) => {
		onDelete({
			details: {
				id: id,
				added: dateStr
			},

			buttonEvent
		});
	};
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row gap-2">
		<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
			<div class="input-group-shim">{unit}</div>
			<input
				class="{maxWidthCss} w-full unset-fit"
				type="number"
				{placeholder}
				aria-label="amount"
				bind:value
				{disabled}
			/>
			{#if categories}
				<select aria-label="category" {disabled} bind:value={category}>
					{#each categories as category}
						<option value={category.shortvalue}>{category.longvalue}</option>
					{/each}
				</select>
			{/if}
		</div>
		{#if compact}
			<TrackerButtons
				{unit}
				{existing}
				onAdd={addCallback}
				onUpdate={updateCallback}
				onDelete={deleteCallback}
				bind:previous
				bind:changeAction
				bind:disabled
				bind:value
				bind:category
			/>
		{/if}
	</div>
	{#if !compact}
		<TrackerButtons
			{unit}
			{existing}
			onAdd={addCallback}
			onUpdate={updateCallback}
			onDelete={deleteCallback}
			bind:previous
			bind:changeAction
			bind:disabled
			bind:value
			bind:category
		/>
	{/if}
</div>

<style>
	.unset-fit {
		min-width: unset !important;
	}
</style>
