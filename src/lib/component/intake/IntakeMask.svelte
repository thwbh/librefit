<script lang="ts">
	import { getFoodCategoryIcon, getFoodCategoryLongvalue } from '$lib/api/category';
	import { NumberStepper } from '@thwbh/veilchen';
	import { getCategoriesContext } from '$lib/context';
	import type { Intake, NewIntake } from '$lib/api';

	interface Props {
		entry: Intake | NewIntake;
		class?: string;
		/**
		 * Compact one-row summary used in stacks/lists. Defaults to false; the
		 * modal context renders the full form. Stack/list callers pass
		 * `compact` to get the small card.
		 */
		compact?: boolean;
		/**
		 * Disable interaction with the full form. Used in the modal's
		 * delete-confirm view so the same layout renders without resizing,
		 * but inputs/buttons are inert. Ignored when `compact` is true.
		 */
		readonly?: boolean;
		isEditing?: boolean;
		onedit?: () => void;
	}

	let {
		entry = $bindable(),
		class: className = 'fieldset rounded-box',
		compact = false,
		readonly = false
	}: Props = $props();

	// Get categories from context instead of props
	const categories = getCategoriesContext();

	const select = (categoryShortvalue: string) => {
		entry.category = categoryShortvalue;
	};
</script>

{#if compact}
	<fieldset class="fieldset rounded-box p-3 space-y-2">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">
				{getFoodCategoryLongvalue(categories, entry.category)}
			</h3>
			<div class="text-right">
				<p class="text-2xl font-bold">
					{entry.amount} <span class="text-xs">kcal</span>
				</p>
				<p class="text-xs opacity-60">{entry.time}</p>
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
	<!--
		`<fieldset disabled>` propagates :disabled to every child form control —
		used for the delete-confirm view. The InlineNumberWheel's first-open
		scroll glitch is unrelated (tracked upstream: thwbh/veilchen#5) and
		affects the editable view too, so fieldset isn't the cause; it's kept
		here for proper :disabled semantics in the read-only delete preview.
	-->
	<svelte:element
		this={readonly ? 'fieldset' : 'div'}
		class="flex flex-col gap-1 w-full"
		disabled={readonly || undefined}
	>
		<span class="text-lg mt-1 font-semibold"
			>{getFoodCategoryLongvalue(categories, entry.category)}</span
		>
		<div class="bg-base-200 rounded-lg p-1 flex join">
			{#each categories as category (category.shortvalue)}
				{@const Icon = getFoodCategoryIcon(category.shortvalue)}
				<button
					class="btn flex-1 min-w-0 join-item"
					class:btn-accent={entry.category === category.shortvalue}
					class:shadow-sm={entry.category === category.shortvalue}
					onclick={() => select(category.shortvalue)}
					disabled={readonly}
					aria-label="Select {category.longvalue}"
					aria-pressed={entry.category === category.shortvalue}
				>
					<Icon size="1.5rem" />
				</button>
			{/each}
		</div>

		<NumberStepper
			bind:value={entry.amount}
			label=""
			unit="kcal"
			min={1}
			max={10000}
			incrementSteps={[1, 5, 10, 100, 250]}
			decrementSteps={[1, 5, 10, 100, 250]}
			initialIncrementStep={10}
			initialDecrementStep={10}
			showLeftWheel={false}
		/>

		<div class="flex flex-col gap-1">
			<textarea
				class="textarea w-full"
				placeholder="Description..."
				bind:value={entry.description}
				disabled={readonly}
				rows={2}
				maxlength={500}
			></textarea>
			<span class="text-xs opacity-60 text-right">
				{entry.description?.length || 0} / 500
			</span>
		</div>
	</svelte:element>
{/if}

<style>
	:disabled {
		color: var(--text-color);
	}
</style>
