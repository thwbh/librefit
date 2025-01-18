<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getDaytimeFoodCategory } from '$lib/date';
	import TrackerButtons from './TrackerButtons.svelte';
	import type { FoodCategory } from '$lib/model';

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
		placeholder = 'Amount...'
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let previous: any = $state();
	let changeAction = $state();

	const add = (e) => {
		dispatch('add', {
			id: id,
			dateStr: dateStr,
			value: value,
			category: category,
			callback: () => {
				e.detail.callback();
			}
		});
	};

	const update = (e) => {
		e.preventDefault();

		if (value !== previous.value || category !== previous.category) {
			dispatch('update', {
				id: id,
				dateStr: dateStr,
				value: value,
				category: category,
				callback: () => e.detail.callback()
			});
		}
	};

	const remove = (e) => {
		e.preventDefault();

		dispatch('remove', {
			id: id,
			dateStr: dateStr,
			target: e.target,
			callback: () => e.detail.callback()
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
				on:add={add}
				on:update={update}
				on:remove={remove}
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
			on:add={add}
			on:update={update}
			on:remove={remove}
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
