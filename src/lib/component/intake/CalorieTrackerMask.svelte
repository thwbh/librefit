<script lang="ts">
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import type { CalorieTracker, FoodCategory, NewCalorieTracker } from '$lib/api/gen';
	import { ValidatedInput } from '@thwbh/veilchen';
	import { PenSolid } from 'flowbite-svelte-icons';

	interface Props {
		entry: CalorieTracker | NewCalorieTracker;
		categories: Array<FoodCategory>;
		className?: string;
		readonly?: boolean;
		isEditing?: boolean;
		onedit?: () => void;
	}

	let {
		entry = $bindable(),
		categories,
		className = 'fieldset rounded-box',
		isEditing = false,
		readonly = false,
		onedit = () => {}
	}: Props = $props();

	const select = (categoryShortvalue: string) => {
		entry.category = categoryShortvalue;
	};
</script>

<fieldset class={className}>
	{#if !readonly}
		<span> Category </span>
	{/if}

	<div class="flex flex-row items-center justify-between w-full grow">
		{#if isEditing}
			<div class="dropdown dropdown-center w-full">
				<button tabindex="0" class="m-1 btn w-full" disabled={readonly}
					><span class="text-left w-full"
						>{getFoodCategoryLongvalue(categories, entry.category)}</span
					></button
				>
				<ul class="p-2 shadow-sm menu dropdown-content z-1 bg-base-100 rounded-box w-full">
					{#each categories as category}
						<li>
							<button onclick={() => select(category.shortvalue)}>{category.longvalue}</button>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="font-bold">
				{getFoodCategoryLongvalue(categories, entry.category)}
			</p>

			<button class="btn btn-xs btn-ghost" onclick={onedit} aria-label="press to edit"
				><!-- Press to edit -->
				<PenSolid height="1rem" width="1rem" />
			</button>
		{/if}
	</div>

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
