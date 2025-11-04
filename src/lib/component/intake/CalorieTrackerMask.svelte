<script lang="ts">
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import type { CalorieTracker, NewCalorieTracker } from '$lib/api/gen';
	import { NumberStepper, ValidatedInput } from '@thwbh/veilchen';
	import { PencilSimple } from 'phosphor-svelte';
	import { getCategoriesContext } from '$lib/context';

	interface Props {
		entry: CalorieTracker | NewCalorieTracker;
		className?: string;
		readonly?: boolean;
		isEditing?: boolean;
		onedit?: () => void;
	}

	let {
		entry = $bindable(),
		className = 'fieldset rounded-box',
		isEditing = false,
		readonly = false,
		onedit = () => {}
	}: Props = $props();

	// Get categories from context instead of props
	const categories = getCategoriesContext();

	const select = (categoryShortvalue: string) => {
		entry.category = categoryShortvalue;
	};
</script>

<fieldset class={className}>
	{#if !readonly}
		<span> Category </span>
	{/if}

	{#if readonly}
		<div class="badge badge-md badge-primary">
			{getFoodCategoryLongvalue(categories, entry.category)}
		</div>
	{:else if isEditing}
		<div class="w-full overflow-x-auto p-4 snap-x snap-mandatory">
			<div class="flex gap-2 w-max">
				{#each categories as category}
					<button
						class="badge badge-md whitespace-nowrap snap-start"
						class:badge-primary={entry.category === category.shortvalue}
						class:badge-outline-neutral={entry.category !== category.shortvalue}
						onclick={() => select(category.shortvalue)}
						disabled={readonly}
						aria-label="Select {category.longvalue}"
						aria-pressed={entry.category === category.shortvalue}
					>
						{category.longvalue}
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between w-full grow">
			<div class="badge badge-md badge-primary">
				{getFoodCategoryLongvalue(categories, entry.category)}
			</div>

			<button class="btn btn-xs btn-ghost" onclick={onedit} aria-label="press to edit"
				><!-- Press to edit -->
				<PencilSimple size="1rem" />
			</button>
		</div>
	{/if}

	<div class="flex flex-col gap-2 w-full">
		{#if !readonly}
			<NumberStepper
				bind:value={entry.amount}
				label="Amount"
				unit="kcal"
				min={1}
				max={10000}
				incrementSteps={[1, 5, 10, 100, 250]}
				decrementSteps={[1, 5, 10, 100, 250]}
				initialIncrementStep={10}
				initialDecrementStep={10}
				showLeftWheel={false}
			/>
		{:else}
			<ValidatedInput
				bind:value={entry.amount}
				label="Amount"
				type="number"
				unit="kcal"
				required
				placeholder="Amount..."
				errorInline={true}
				min="1"
				max="10000"
				disabled={readonly}
			>
				Please enter a valid amount.
			</ValidatedInput>
		{/if}
	</div>

	<textarea
		class="textarea w-full"
		placeholder="Description..."
		bind:value={entry.description}
		disabled={readonly}
	></textarea>
</fieldset>

<style>
	:disabled {
		color: var(--text-color);
	}
</style>
