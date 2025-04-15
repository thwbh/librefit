<script lang="ts">
	import type { CalorieTracker, NewCalorieTracker } from '$lib/model';
	import { ValidatedInput } from '@thwbh/veilchen';
	import { PenSolid } from 'flowbite-svelte-icons';

	interface Props {
		entry: CalorieTracker | NewCalorieTracker;
		isEditing?: boolean;
	}

	let { entry = $bindable(), isEditing = false }: Props = $props();

	let categoryLongvalue = $state('');

	const select = (categoryShortvalue: string) => {
		entry.category = categoryShortvalue;
	};

	$effect(() => {
		if (entry) {
			if (entry.category === 'b') categoryLongvalue = 'Breakfast';
			else if (entry.category === 'l') categoryLongvalue = 'Lunch';
			else if (entry.category === 'd') categoryLongvalue = 'Dinner';
		}
	});
</script>

<fieldset class="fieldset rounded-box">
	<span> Category </span>

	<div class="flex flex-row items-center justify-between w-full grow">
		{#if isEditing}
			<button class="btn grow text-left" popovertarget="popover-1" style="anchor-name:--anchor-1">
				{categoryLongvalue}
			</button>
			<ul
				class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
				popover="auto"
				id="popover-1"
				style="position-anchor:--anchor-1"
			>
				<li><button class="btn btn-ghost" onclick={() => select('b')}>Breakfast</button></li>
				<li><button class="btn btn-ghost" onclick={() => select('l')}>Lunch</button></li>
				<li><button class="btn btn-ghost" onclick={() => select('d')}>Dinner</button></li>
			</ul>
		{:else}
			<p class="font-bold">
				{categoryLongvalue}
			</p>

			<button class="btn btn-xs btn-ghost"
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
	>
		Please enter a valid amount.
	</ValidatedInput>

	<textarea class="textarea w-full" placeholder="Description..." bind:value={entry.description}
	></textarea>
</fieldset>
