<script lang="ts">
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import { NumberStepper } from '@thwbh/veilchen';
	import { getCategoriesContext } from '$lib/context';
	import type { Intake, NewIntake } from '$lib/api';

	interface Props {
		entry: Intake | NewIntake;
		class?: string;
		readonly?: boolean;
		isEditing?: boolean;
		onedit?: () => void;
	}

	let {
		entry = $bindable(),
		class: className = 'fieldset rounded-box',
		readonly = false
	}: Props = $props();

	// Get categories from context instead of props
	const categories = getCategoriesContext();

	const select = (categoryShortvalue: string) => {
		entry.category = categoryShortvalue;
	};
</script>

{#if readonly}
	<fieldset class="fieldset rounded-box p-3 space-y-2">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">
				{getFoodCategoryLongvalue(categories, entry.category)}
			</h3>
			<div class="text-right">
				<p class="text-2xl font-bold">
					{entry.amount} <span class="text-xs">kcal</span>
				</p>
				<p class="text-xs opacity-60">2:30 PM</p>
			</div>
		</div>

		<div class="min-h-[2rem]">
			{#if entry.description}
				<p class="text-sm opacity-75 line-clamp-2 break-words overflow-x-scroll">
					{entry.description}
				</p>
			{/if}
		</div>
	</fieldset>
{:else}
	<fieldset class={className}>
		<span> Category </span>

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

		<div class="flex flex-col gap-2 w-full">
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

			<textarea
				class="textarea w-full"
				placeholder="Description..."
				bind:value={entry.description}
				disabled={readonly}
				rows={3}
				maxlength={500}
			></textarea>
			<span class="text-xs opacity-60 text-right">
				{entry.description?.length || 0} / 500
			</span>
		</div>
	</fieldset>
{/if}

<style>
	:disabled {
		color: var(--text-color);
	}
</style>
