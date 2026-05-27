<script lang="ts">
	import IntakeFab from '$lib/component/intake/IntakeFab.svelte';
	import IntakeScore from '$lib/component/intake/IntakeScore.svelte';
	import IntakeStack from '$lib/component/intake/IntakeStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import WeightModal from '$lib/component/weight/WeightModal.svelte';
	import {
		createIntake,
		createWeightTrackerEntry,
		deleteIntake,
		updateIntake,
		updateWeightTrackerEntry,
		type Dashboard,
		type Intake,
		type IntakeTarget,
		type NewIntake,
		type NewWeightTracker,
		type WeightTarget,
		type WeightTracker
	} from '$lib/api';
	import { getUserContext } from '$lib/context';
	import { debug } from '@tauri-apps/plugin-log';
	import { Avatar, useRefresh } from '@thwbh/veilchen';
	import { invalidate } from '$app/navigation';
	import { CaretDown, Lightning, TrendDown, TrendUp } from 'phosphor-svelte';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import {
		convertDateStrToDisplayDateStr,
		getDateAsStr,
		getDisplayDateAsStr,
		parseStringAsDate
	} from '$lib/date';
	import IntakeModal from '$lib/component/intake/IntakeModal.svelte';
	import { defaultCategoryForDate } from '$lib/api/category';
	import { getAvatarFromUser } from '$lib/avatar';
	import { differenceInDays } from 'date-fns';
	import { slide, fly } from 'svelte/transition';
	import NumberFlow from '@number-flow/svelte';
	import IntakePlanCard from '$lib/component/journey/IntakePlanCard.svelte';
	import EncouragementMessage from '$lib/component/journey/EncouragementMessage.svelte';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;
	const userContext = getUserContext();

	let index: number = $state(0);
	let intake: Array<Intake> = $state(dashboard.intakeTodayList);
	let lastWeightTracker: WeightTracker = $state(dashboard.weightLatest);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const intakeTarget: IntakeTarget = dashboard.intakeTarget;

	const totalDays = dashboard.daysTotal;
	const dayDiff = totalDays - dashboard.currentDay;

	const progress = totalDays === 0 ? 0 : Math.round(((totalDays - dayDiff) / totalDays) * 100);

	// Review plan accordion
	let showPlan = $state(false);

	const currentWeight = $derived(lastWeightTracker?.amount ?? weightTarget.initialWeight);

	// Average daily intake from this week's entries
	const averageIntake = $derived.by(() => {
		const weekList = dashboard.intakeWeekList;
		if (weekList.length === 0) return 0;
		const dailyTotals = new Map<string, number>();
		for (const entry of weekList) {
			dailyTotals.set(entry.added, (dailyTotals.get(entry.added) ?? 0) + entry.amount);
		}
		const total = [...dailyTotals.values()].reduce((a, b) => a + b, 0);
		return Math.round(total / dailyTotals.size);
	});
	const weightTrackedToday = $derived(lastWeightTracker?.added === getDateAsStr(new Date()));
	const weightLabel = $derived(
		!lastWeightTracker
			? 'No data'
			: weightTrackedToday
				? 'Today'
				: convertDateStrToDisplayDateStr(lastWeightTracker.added)
	);
	const daysElapsed = $derived(
		Math.max(0, differenceInDays(new Date(), parseStringAsDate(weightTarget.startDate)))
	);
	const weightChange = $derived(weightTarget.initialWeight - currentWeight);
	const isGaining = $derived(weightTarget.targetWeight > weightTarget.initialWeight);
	const isOnTrack = $derived(
		isGaining
			? currentWeight >= weightTarget.initialWeight
			: currentWeight <= weightTarget.initialWeight
	);
	const goalReached = $derived(
		isGaining
			? currentWeight >= weightTarget.targetWeight
			: currentWeight <= weightTarget.targetWeight
	);

	// Avatar
	const avatarSrc = $derived(
		userContext.user ? getAvatarFromUser(userContext.user.name, userContext.user.avatar) : ''
	);

	// Display date
	const displayDate = getDisplayDateAsStr(new Date());

	const weightTracker: WeightTracker = $state(dashboard.weightTodayList[0]);

	let intakeToday: Array<number> = $derived(intake.map((tracker) => tracker.amount));

	const getBlankEntry = (): NewIntake => {
		const now = new Date();
		return {
			category: defaultCategoryForDate(now),
			added: getDateAsStr(now),
			amount: 0,
			description: ''
		};
	};

	const modal = useEntryModal<Intake, NewIntake>({
		onCreate: (entry) => createIntake({ newEntry: entry }),
		onUpdate: (id, entry) => updateIntake({ trackerId: id, updatedEntry: entry }),
		onDelete: (id) => deleteIntake({ trackerId: id }),
		getBlankEntry,
		onCreateSuccess: (newEntry) => {
			intake = [...intake, newEntry];
			index = intake.length - 1;
		},
		onUpdateSuccess: (updatedEntry) => {
			intake[index] = updatedEntry;
		},
		onDeleteSuccess: () => {
			if (intake.length === 1) {
				intake = [];
			} else {
				const deletedIndex = index;
				intake = intake.toSpliced(deletedIndex, 1);
				if (index === intake.length && index > 0) {
					index--;
				} else {
					index = 0;
				}
			}
		}
	});

	const modalWeight = useEntryModal<WeightTracker, NewWeightTracker>({
		onCreate: (entry) => createWeightTrackerEntry({ newEntry: entry }),
		onUpdate: (id, entry) => updateWeightTrackerEntry({ trackerId: id, updatedEntry: entry }),
		onDelete: (_) => {
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

	debug(`dashboardData=${JSON.stringify(dashboard)}`);
	debug(`user profile=${JSON.stringify(userContext.user)}`);

	useRefresh(() => invalidate('data:dashboardData'));
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Dashboard</h1>

	<!-- Header -->
	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				<span class="text-3xl font-bold">Day {dashboard.currentDay + 1}</span>
				<span class="text-sm opacity-70">{displayDate}</span>
			</div>

			{#if avatarSrc}
				<Avatar size="lg" src={avatarSrc} />
			{/if}
		</div>

		<!-- Progress bar -->
		<div class="mt-6">
			<div class="flex justify-between items-center mb-2">
				<span class="text-xs opacity-70">{dayDiff} days left</span>
				<button
					class="btn btn-xs btn-outline border-primary-content/30 text-primary-content hover:bg-primary-content hover:text-primary"
					onclick={() => (showPlan = !showPlan)}
				>
					Review plan
					<CaretDown
						size="0.75em"
						class="transition-transform duration-300 {showPlan ? 'rotate-180' : ''}"
					/>
				</button>
			</div>
			<div class="journey-bar-track">
				<div class="journey-bar-fill" style="width: calc({progress}% + 0.5rem)"></div>
			</div>

			<!-- Start / Target labels around the progress bar -->
			{#if showPlan}
				<div transition:slide={{ duration: 300 }}>
					<div class="flex justify-between mt-4" in:fly={{ y: 10, duration: 300 }}>
						<div class="flex flex-col">
							<span class="text-2xl font-bold">
								<NumberFlow value={weightTarget.initialWeight} /> <span class="text-xs">kg</span>
							</span>
							<span class="text-xs opacity-70"
								>{convertDateStrToDisplayDateStr(weightTarget.startDate)}</span
							>
						</div>
						<div class="flex flex-col items-end">
							<span class="text-2xl font-bold">
								<NumberFlow value={weightTarget.targetWeight} /> <span class="text-xs">kg</span>
							</span>
							<span class="text-xs opacity-70"
								>{convertDateStrToDisplayDateStr(weightTarget.endDate)}</span
							>
						</div>
					</div>

					<!-- Today callout -->
					<div
						class="bg-base-100 text-base-content rounded-lg p-3 mt-4 flex items-center justify-between"
						in:fly={{ y: 10, duration: 300, delay: 100 }}
					>
						<div class="flex items-center gap-2">
							<Lightning size="1.25rem" weight="bold" />
							<span class="font-semibold">{weightLabel}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xl font-bold">
								<NumberFlow value={currentWeight} /> <span class="text-xs">kg</span>
							</span>
							{#if weightChange === 0}
								<span class="text-xs opacity-60">No change yet</span>
							{:else if isOnTrack}
								{#if isGaining}
									<TrendUp size="1rem" weight="bold" />
								{:else}
									<TrendDown size="1rem" weight="bold" />
								{/if}
								<span class="text-xs">{Math.abs(weightChange).toFixed(1)} kg</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Calorie plan & encouragement below the progress bar -->
		{#if showPlan}
			<div transition:slide={{ duration: 300 }} class="flex flex-col gap-4 mt-4">
				<div in:fly={{ y: 20, duration: 400, delay: 150 }}>
					<IntakePlanCard
						dailyRate={Math.abs(intakeTarget.maximumCalories - intakeTarget.targetCalories)}
						recommendation={weightTarget.targetWeight > weightTarget.initialWeight
							? 'GAIN'
							: 'LOSE'}
						targetCalories={intakeTarget.targetCalories}
						maximumCalories={intakeTarget.maximumCalories}
						{averageIntake}
					/>
				</div>

				<div in:fly={{ y: 20, duration: 400, delay: 250 }}>
					<EncouragementMessage
						{daysElapsed}
						daysLeft={dayDiff}
						{averageIntake}
						targetCalories={intakeTarget.targetCalories}
						{goalReached}
					/>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content area -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col gap-6 p-4 pt-6">
		<div class="flex flex-col items-center gap-2 w-full">
			<IntakeScore {intakeTarget} entries={intakeToday} />
			<IntakeStack bind:index bind:entries={intake} onEdit={modal.openEdit} class="w-full" />
		</div>

		<div class="flex flex-col items-center w-full">
			<WeightScore
				weightTracker={lastWeightTracker}
				{weightTarget}
				onupdate={modalWeight.openCreate}
			/>
		</div>
	</div>
</div>
<IntakeFab onclick={modal.openCreate} />
<!-- Intake creation modal -->
<IntakeModal
	bind:dialog={modal.createDialog.value}
	bind:entry={modal.currentEntry}
	mode="create"
	errorMessage={modal.errorMessage}
	onsave={modal.save}
	oncancel={modal.cancel}
/>

<!-- Intake update modal -->
<IntakeModal
	bind:dialog={modal.editDialog.value}
	bind:entry={modal.currentEntry}
	mode="edit"
	enableDelete={modal.enableDelete}
	errorMessage={modal.errorMessage}
	onsave={modal.save}
	oncancel={modal.cancel}
	onrequestdelete={modal.requestDelete}
	ondelete={modal.deleteEntry}
/>

<!-- Weight modal -->
<WeightModal
	bind:dialog={modalWeight.createDialog.value}
	bind:entry={modalWeight.currentEntry}
	errorMessage={modalWeight.errorMessage}
	onsave={modalWeight.save}
	oncancel={modalWeight.cancel}
/>

<style>
	.journey-bar-track {
		height: 0.25rem;
		border-radius: 9999px;
		background-color: oklch(0.85 0.02 280);
		overflow: visible;
		position: relative;
	}

	.journey-bar-fill {
		height: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background-color: var(--color-accent);
		position: relative;
		min-width: 1rem;
		transition: width 0.6s ease;
		clip-path: polygon(0% 0%, calc(100% - 0.5rem) 0%, 100% 50%, calc(100% - 0.5rem) 100%, 0% 100%);
	}
</style>
