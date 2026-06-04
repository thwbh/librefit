<script lang="ts">
	import type { Intake, IntakeTarget, WeightTracker, WorkoutDetail } from '$lib/api';
	import { getFoodCategoryIcon, getFoodCategoryLongvalue } from '$lib/api/category';
	import { getCategoriesContext } from '$lib/context';
	import IntakeScore from '$lib/component/intake/IntakeScore.svelte';
	import WorkoutSummaryCard from '$lib/component/workout/WorkoutSummaryCard.svelte';
	import { SwipeableListItem } from '@thwbh/veilchen';
	import { useSwipe } from 'svelte-gestures';
	import { longpress } from '$lib/gesture/long-press';
	import { Barbell, ForkKnife, HandTap, Pencil, Trash } from 'phosphor-svelte';
	import NumberFlow from '@number-flow/svelte';

	interface Props {
		intakeTarget: IntakeTarget;
		intakeEntries: Intake[];
		weightEntries: WeightTracker[];
		/** Completed workouts for the selected day (the "Activity" section). */
		workoutEntries?: WorkoutDetail[];
		/** True when the selected day is today — drives the workout button label. */
		isToday?: boolean;
		ondayswipe: (event: CustomEvent) => void;
		oneditintake: (entry: Intake) => void;
		ondeleteintake: (entry: Intake) => void;
		onaddintake: () => void;
		oneditweight: (entry: WeightTracker) => void;
		oncreateweight: () => void;
		ontapworkout?: (entry: WorkoutDetail) => void;
		oneditworkout?: (entry: WorkoutDetail) => void;
		ondeleteworkout?: (entry: WorkoutDetail) => void;
		onaddworkout?: () => void;
	}

	let {
		intakeTarget,
		intakeEntries,
		weightEntries,
		workoutEntries = [],
		isToday = false,
		ondayswipe,
		oneditintake,
		ondeleteintake,
		onaddintake,
		oneditweight,
		oncreateweight,
		ontapworkout,
		oneditworkout,
		ondeleteworkout,
		onaddworkout
	}: Props = $props();

	const foodCategories = getCategoriesContext();
</script>

<div class="flex flex-col gap-4">
	<!-- Intake score (swipeable for day nav) -->
	<div
		{...useSwipe(ondayswipe, () => ({
			timeframe: 300,
			minSwipeDistance: 60,
			touchAction: 'pan-y'
		}))}
	>
		<IntakeScore {intakeTarget} entries={intakeEntries.map((c) => c.amount)} isHistory={true} />
	</div>

	<!-- Tracked Categories -->
	<div class="bg-base-200 rounded-lg p-1 flex join">
		{#each foodCategories as cat (cat.shortvalue)}
			{@const Icon = getFoodCategoryIcon(cat.shortvalue)}
			{@const isTracked = intakeEntries.some((e) => e.category === cat.shortvalue)}

			<button class="btn flex-1 min-w-0 join-item" class:btn-accent={isTracked}>
				<Icon size="1.5rem" />
			</button>
		{/each}
	</div>

	<!-- Entry list -->
	{#if intakeEntries.length > 0}
		<div class="bg-base-100 rounded-box shadow overflow-hidden">
			{#each intakeEntries as calories, i}
				<SwipeableListItem
					onleft={() => oneditintake(calories)}
					onright={() => ondeleteintake(calories)}
				>
					{#snippet leftAction()}
						<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
					{/snippet}

					{#snippet rightAction()}
						<span><Trash size="1.75rem" color={'var(--color-error)'} /></span>
					{/snippet}

					<div
						class="flex items-center justify-between gap-2 px-4 py-3 {i > 0
							? 'border-t border-base-200'
							: ''}"
						use:longpress
						onlongpress={() => oneditintake(calories)}
					>
						<div class="flex flex-col">
							<span class="text-base font-semibold">
								{calories.description}
							</span>
							<span class="text-sm opacity-60">
								{calories.amount} kcal
							</span>
						</div>
						<span class="badge badge-xs"
							>{getFoodCategoryLongvalue(foodCategories, calories.category)}</span
						>
					</div>
				</SwipeableListItem>
			{/each}
		</div>
	{:else}
		<div
			class="rounded-box border-2 border-dashed border-base-300 p-8 flex flex-col items-center gap-3"
		>
			<ForkKnife size="2.5rem" class="opacity-20" />
			<div class="text-center">
				<p class="font-medium opacity-40">No meals logged</p>
				<p class="text-xs opacity-30 mt-1">Tap below to start tracking</p>
			</div>
		</div>
	{/if}

	<button class="btn btn-neutral w-full" onclick={onaddintake}>Add Intake</button>

	<!-- Activity (workouts) — [HI-014], between intake and weight -->
	<h2 class="text-xs font-bold uppercase opacity-50 px-1">Activity</h2>
	{#if workoutEntries.length > 0}
		<div class="flex flex-col gap-2">
			{#each workoutEntries as workout (workout.session.id)}
				<WorkoutSummaryCard
					detail={workout}
					ontap={ontapworkout}
					onedit={oneditworkout}
					ondelete={ondeleteworkout}
				/>
			{/each}
		</div>
	{:else}
		<div
			class="rounded-box border-2 border-dashed border-base-300 p-8 flex flex-col items-center gap-3"
		>
			<Barbell size="2.5rem" class="opacity-20" />
			<div class="text-center">
				<p class="font-medium opacity-40">No workouts logged</p>
				<p class="text-xs opacity-30 mt-1">
					{isToday ? 'Start a session below' : 'Tap below to add one'}
				</p>
			</div>
		</div>
	{/if}

	<button class="btn btn-neutral w-full" onclick={onaddworkout}>
		{isToday ? 'Start Workout' : 'Add Workout'}
	</button>

	<!-- Weight (display creation option conditionally) -->
	<div class="bg-base-100 rounded-box shadow overflow-hidden">
		{#if weightEntries.length > 0}
			<SwipeableListItem onleft={() => oneditweight(weightEntries[0])}>
				{#snippet leftAction()}
					<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
				{/snippet}
				<div class="p-4">
					<span class="text-xs opacity-70">Weight</span>
					<div class="text-2xl font-bold mt-1">
						<NumberFlow value={weightEntries[0].amount} />
						<span class="text-sm font-normal">kg</span>
					</div>
				</div>
			</SwipeableListItem>
		{:else}
			<div class="flex flex-row justify-between p-4">
				<div>
					<span class="text-xs opacity-70">Weight</span>

					<div class="text-lg font-semibold mt-1 opacity-50">No weight tracked.</div>
				</div>

				<button
					class="flex flex-row gap-1 items-center cursor-pointer text-left"
					aria-label="Update weight"
					onclick={oncreateweight}
				>
					<span class="text-xs opacity-70 font-bold">Tap to update</span>
					<HandTap size="2rem" class="motion-safe:animate-pulse" />
				</button>
			</div>
		{/if}
	</div>
</div>
