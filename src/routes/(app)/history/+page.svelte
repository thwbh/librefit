<script lang="ts">
	import {
		type Intake,
		type IntakeTarget,
		type NewIntake,
		type NewWeightTracker,
		type TrackerHistory,
		type WeightTracker
	} from '$lib/api';
	import { convertDateStrToDisplayDateStr, getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import NumberFlow from '@number-flow/svelte';
	import { addDays, compareAsc, subDays } from 'date-fns';
	import { getFoodCategoryIcon, getFoodCategoryLongvalue } from '$lib/api/category';
	import { CaretLeft, CaretRight, ForkKnife, HandTap, Pencil, Trash } from 'phosphor-svelte';
	import { ModalDialog, NumberStepper, SwipeableListItem } from '@thwbh/veilchen';
	import { longpress } from '$lib/gesture/long-press';
	import { vibrate } from '@tauri-apps/plugin-haptics';
	import { getCategoriesContext } from '$lib/context';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import { swipe } from 'svelte-gestures';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		createIntake,
		createWeightTrackerEntry,
		deleteIntake,
		getTrackerHistory,
		updateIntake,
		updateWeightTrackerEntry
	} from '$lib/api/gen/commands.js';
	import { debug } from '@tauri-apps/plugin-log';
	import IntakeScore from '$lib/component/intake/IntakeScore.svelte';
	import IntakeMask from '$lib/component/intake/IntakeMask.svelte';

	let { data } = $props();

	const foodCategories = getCategoriesContext();

	// default history is 1 week
	let trackerHistory: TrackerHistory = $state(data.trackerHistory);
	let intakeTarget: IntakeTarget = data.calorieTarget;
	let lastDateStr = data.trackerHistory.dateLastStr;

	let dates = $derived(Object.keys(trackerHistory?.intakeHistory));

	// ensure history can't be scrolled into the future
	let showRightCaret: boolean = $derived(
		compareAsc(parseStringAsDate(lastDateStr), parseStringAsDate(dates[dates.length - 1])) === 1
	);

	let selectedDateStr = $state(dates[dates.length - 1]);

	// Track current day index within the week
	let currentDayIndex = $derived(dates.indexOf(selectedDateStr));

	// Track swipe direction for animations
	let swipeDirection = $state<'left' | 'right' | null>(null);

	let intakeHistory: Array<Intake> = $derived.by(() => {
		if (!trackerHistory || !trackerHistory.intakeHistory[selectedDateStr]) return [];

		return [...trackerHistory?.intakeHistory[selectedDateStr]];
	});

	let weightHistory: Array<WeightTracker> = $derived.by(() => {
		if (!trackerHistory || !trackerHistory.weightHistory[selectedDateStr]) return [];

		return [...trackerHistory?.weightHistory[selectedDateStr]];
	});

	// Modal composition for CRUD operations
	const modal = useEntryModal<Intake, NewIntake>({
		onCreate: (entry) => createIntake({ newEntry: entry }),
		onUpdate: (id, entry) => updateIntake({ trackerId: id, updatedEntry: entry }),
		onDelete: (id) => deleteIntake({ trackerId: id }),
		getBlankEntry: () => ({
			added: selectedDateStr,
			amount: 0,
			category: 't',
			description: ''
		}),
		onCreateSuccess: (newEntry) => {
			trackerHistory = {
				...trackerHistory,
				intakeHistory: {
					...trackerHistory.intakeHistory,
					[selectedDateStr]: [...trackerHistory.intakeHistory[selectedDateStr], newEntry]
				}
			};
		},
		onUpdateSuccess: (updatedEntry) => {
			const entries = [...trackerHistory.intakeHistory[selectedDateStr]];
			const idx = entries.findIndex((e) => e.id === updatedEntry.id);
			if (idx !== -1) {
				entries[idx] = updatedEntry;
				trackerHistory = {
					...trackerHistory,
					intakeHistory: {
						...trackerHistory.intakeHistory,
						[selectedDateStr]: entries
					}
				};
			}
		},
		onDeleteSuccess: (id) => {
			trackerHistory = {
				...trackerHistory,
				intakeHistory: {
					...trackerHistory.intakeHistory,
					[selectedDateStr]: trackerHistory.intakeHistory[selectedDateStr].filter(
						(e) => e.id !== id
					)
				}
			};
		}
	});

	const modalWeight = useEntryModal<WeightTracker, NewWeightTracker>({
		onCreate: (entry) => createWeightTrackerEntry({ newEntry: entry }),
		onUpdate: (id, entry) => updateWeightTrackerEntry({ trackerId: id, updatedEntry: entry }),
		onDelete: (_) => {
			throw new Error('Delete not supported for weight entries');
		},
		getBlankEntry: () => ({
			added: selectedDateStr,
			amount: 0
		}),
		onCreateSuccess: (newEntry) => {
			trackerHistory = {
				...trackerHistory,
				weightHistory: {
					...trackerHistory.weightHistory,
					[selectedDateStr]: [...trackerHistory.weightHistory[selectedDateStr], newEntry]
				}
			};
		},
		onUpdateSuccess: (updatedEntry) => {
			const entries = [...trackerHistory.weightHistory[selectedDateStr]];

			const idx = entries.findIndex((e) => e.id === updatedEntry.id);
			if (idx !== -1) {
				entries[idx] = updatedEntry;
				trackerHistory = {
					...trackerHistory,
					weightHistory: {
						...trackerHistory.weightHistory,
						[selectedDateStr]: entries
					}
				};
			}
		}
	});

	const selectHistory = (dateStr: string) => {
		debug(`selectHistory dateStr={${dateStr}}`);
		swipeDirection = null; // Reset direction when clicking a date
		selectedDateStr = dateStr;
	};

	const scrollLeft = () => {
		swipeDirection = 'right';
		const firstDate = parseStringAsDate(dates[0]);

		updateRange(subDays(firstDate, 7), subDays(firstDate, 1));
	};

	const scrollRight = () => {
		swipeDirection = 'left';
		let lastDate = parseStringAsDate(dates[dates.length - 1]);

		if (lastDate) lastDate = addDays(lastDate, 1);

		updateRange(lastDate, addDays(lastDate, 6));
	};

	const updateRange = async (dateFrom: Date, dateTo: Date) => {
		const result = await getTrackerHistory({
			dateFromStr: getDateAsStr(dateFrom),
			dateToStr: getDateAsStr(dateTo)
		});

		if (result) {
			trackerHistory = result;
			// After loading new week, select appropriate day based on swipe direction
			if (swipeDirection === 'right') {
				// Came from scrollLeft, select last day
				selectedDateStr = Object.keys(result.intakeHistory).sort().pop() || '';
			} else if (swipeDirection === 'left') {
				// Came from scrollRight, select first day
				selectedDateStr = Object.keys(result.intakeHistory).sort()[0] || '';
			}
		}
	};

	const getActiveClass = (dateStr: string) =>
		dateStr === selectedDateStr
			? 'bg-primary-content text-primary'
			: 'text-primary-content/70 hover:bg-primary-content/10';

	const edit = async (calories: Intake) => {
		await vibrate(2);
		modal.openEdit(calories);
	};

	const remove = async (calories: Intake) => {
		await vibrate(2);
		modal.openDelete(calories);
	};

	const createWeight = async () => {
		await vibrate(2);
		modalWeight.openCreate();
	};

	const editWeight = async (weight: WeightTracker) => {
		await vibrate(2);
		modalWeight.openEdit(weight);
	};

	// Animation parameters based on swipe direction
	// When swiping left, new content comes from right (positive x)
	// When swiping right, new content comes from left (negative x)
	const flyParams = $derived({
		x: swipeDirection === 'left' ? 300 : swipeDirection === 'right' ? -300 : 0,
		duration: 200,
		delay: 150,
		easing: cubicOut
	});

	// Swipe handler for week navigation (date selector area)
	const handleWeekSwipe = (event: CustomEvent) => {
		const direction = event.detail.direction;
		if (direction === 'left') {
			// Swipe left = go to next week (if available)
			if (showRightCaret) {
				scrollRight();
			}
		} else if (direction === 'right') {
			// Swipe right = go to previous week
			scrollLeft();
		}
	};

	// Swipe handler for day navigation (content area)
	const handleDaySwipe = (event: CustomEvent) => {
		const direction = event.detail.direction;
		if (direction === 'left') {
			// Swipe left = go forward in time
			if (currentDayIndex < dates.length - 1) {
				// Not at end of week, go to next day
				swipeDirection = 'left';
				selectedDateStr = dates[currentDayIndex + 1];
			} else if (showRightCaret) {
				// At end of week and more data available, load next week
				scrollRight();
			}
		} else if (direction === 'right') {
			// Swipe right = go backward in time
			if (currentDayIndex > 0) {
				// Not at start of week, go to previous day
				swipeDirection = 'right';
				selectedDateStr = dates[currentDayIndex - 1];
			} else {
				// At start of week, load previous week
				scrollLeft();
			}
		}
	};
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">History</h1>

	<!-- Header -->
	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		{#if selectedDateStr}
			{@const selectedDate = parseStringAsDate(selectedDateStr)}
			<div class="flex items-center justify-between">
				<span class="text-3xl font-bold">{getDateAsStr(selectedDate, 'MMMM yyyy')}</span>
				<div class="flex flex-col items-end">
					<span class="text-2xl font-bold">
						<NumberFlow value={trackerHistory.caloriesAverage} />
					</span>
					<span class="text-xs opacity-70">avg kcal/day</span>
				</div>
			</div>
		{/if}

		<!-- Date selector -->
		<div
			class="grid grid-cols-9 gap-1 mt-6"
			use:swipe={() => ({ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' })}
			onswipe={handleWeekSwipe}
		>
			<button class="place-self-center opacity-70 hover:opacity-100" onclick={scrollLeft}>
				<CaretLeft size="1.25em" />
			</button>

			{#each dates as dateStr}
				{@const dayNumber = getDateAsStr(parseStringAsDate(dateStr), 'dd')}
				{@const dayName = getDateAsStr(parseStringAsDate(dateStr), 'EE')}
				<button
					onclick={() => selectHistory(dateStr)}
					class="rounded-field flex flex-col items-center px-2 py-1 transition-colors {getActiveClass(
						dateStr
					)}"
				>
					<span class="text-sm font-semibold">{dayNumber}</span>
					<span class="text-[10px] font-semibold opacity-60">{dayName}</span>
				</button>
			{/each}

			{#if showRightCaret}
				<button class="place-self-center opacity-70 hover:opacity-100" onclick={scrollRight}>
					<CaretRight size="1.25em" />
				</button>
			{:else}
				<div></div>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col p-4 pt-6">
		{#key selectedDateStr}
			<div
				in:fly={flyParams}
				out:fly={{ x: -flyParams.x, duration: 150, easing: cubicOut }}
				class="flex flex-col gap-4"
			>
				<!-- Intake score (swipeable for day nav) -->
				<div
					use:swipe={() => ({ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' })}
					onswipe={handleDaySwipe}
				>
					<IntakeScore
						{intakeTarget}
						entries={intakeHistory.map((c) => c.amount)}
						isHistory={true}
					/>
				</div>

				<!-- Tracked Categories -->
				<div class="bg-base-200 rounded-lg p-1 flex join">
					{#each foodCategories as cat (cat.shortvalue)}
						{@const Icon = getFoodCategoryIcon(cat.shortvalue)}
						{@const isTracked = intakeHistory.some((e) => e.category === cat.shortvalue)}

						<button class="btn flex-1 min-w-0 join-item" class:btn-accent={isTracked}>
							<Icon size="1.5rem" />
						</button>
					{/each}
				</div>

				<!-- Entry list -->
				{#if intakeHistory.length > 0}
					<div class="bg-base-100 rounded-box shadow overflow-hidden">
						{#each intakeHistory as calories, i}
							<SwipeableListItem onleft={() => edit(calories)} onright={() => remove(calories)}>
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
									onlongpress={() => edit(calories)}
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

				<button class="btn btn-neutral w-full" onclick={modal.openCreate}> Add Intake </button>

				<!-- Weight (display creation option conditionally) -->
				<div class="bg-base-100 rounded-box shadow overflow-hidden">
					{#if weightHistory.length > 0}
						<SwipeableListItem onleft={() => editWeight(weightHistory[0])}>
							{#snippet leftAction()}
								<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
							{/snippet}
							<div class="p-4">
								<span class="text-xs opacity-70">Weight</span>
								<div class="text-2xl font-bold mt-1">
									<NumberFlow value={weightHistory[0].amount} />
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
								onclick={createWeight}
							>
								<span class="text-xs opacity-70 font-bold">Tap to update</span>
								<HandTap size="2rem" class="motion-safe:animate-pulse" />
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/key}
	</div>
</div>

<!-- Create Intake modal -->
<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">Add Intake</span>
		<span class="text-xs opacity-60">
			Date: {convertDateStrToDisplayDateStr(selectedDateStr)}
		</span>
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<IntakeMask bind:entry={modal.currentEntry} isEditing={true} />
		{/if}
	{/snippet}
</ModalDialog>

<!-- Edit Intake modal -->
<ModalDialog bind:dialog={modal.editDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		{#if modal.currentEntry}
			<span class="modal-header border-l-4 border-accent pl-2">Edit Intake</span>
			<span>
				<span class="text-xs opacity-60">
					Added: {convertDateStrToDisplayDateStr((modal.currentEntry as Intake).added)}
				</span>
				<span>
					<button class="btn btn-xs btn-error">
						<Trash size="1rem" onclick={modal.requestDelete} />
					</button>
				</span>
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<IntakeMask bind:entry={modal.currentEntry as Intake} isEditing={modal.isEditing} />
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if modal.enableDelete}
			<button class="btn btn-error" onclick={modal.deleteEntry}>Delete</button>
		{:else}
			<button class="btn btn-primary" onclick={modal.save}>Save</button>
		{/if}
		<button class="btn" onclick={modal.cancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<!-- Delete Intake modal -->
<ModalDialog
	bind:dialog={modal.deleteDialog.value}
	onconfirm={modal.deleteEntry}
	oncancel={modal.cancel}
>
	{#snippet title()}
		<span>Delete Intake</span>
		<span class="text-sm font-normal opacity-70"> Are you sure? </span>
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<IntakeMask entry={modal.currentEntry as Intake} readonly={true} />
		{/if}
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-error" onclick={modal.deleteEntry}>Delete</button>
		<button class="btn" onclick={modal.cancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<!-- Create WeightTracker modal -->
<ModalDialog
	bind:dialog={modalWeight.createDialog.value}
	onconfirm={modalWeight.save}
	oncancel={modalWeight.cancel}
>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2"> Set Weight </span>
		{#if modalWeight.currentEntry}
			<span class="text-xs opacity-70">
				{convertDateStrToDisplayDateStr((modalWeight.currentEntry as WeightTracker).added)}
			</span>
		{/if}
	{/snippet}
	{#snippet content()}
		<fieldset class="fieldset rounded-box">
			{#if modalWeight.errorMessage}
				<div class="alert alert-error mb-4">
					<span>{modalWeight.errorMessage}</span>
				</div>
			{/if}
			{#if modalWeight.currentEntry}
				<NumberStepper
					bind:value={modalWeight.currentEntry.amount}
					label="Current Weight"
					unit="kg"
					min={30}
					max={330}
					incrementSteps={[0.5, 1, 2, 5, 20, 50]}
					decrementSteps={[0.5, 1, 2, 5, 20, 50]}
					initialIncrementStep={1}
					initialDecrementStep={1}
					showLeftWheel={false}
				/>
			{/if}
		</fieldset>
	{/snippet}
</ModalDialog>

<!-- Edit WeightTracker modal -->
<ModalDialog
	bind:dialog={modalWeight.editDialog.value}
	onconfirm={modalWeight.save}
	oncancel={modalWeight.cancel}
>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2"> Set Weight </span>
		{#if modalWeight.currentEntry}
			<span class="text-xs opacity-70">
				{convertDateStrToDisplayDateStr((modalWeight.currentEntry as WeightTracker).added)}
			</span>
		{/if}
	{/snippet}
	{#snippet content()}
		<fieldset class="fieldset rounded-box">
			{#if modalWeight.errorMessage}
				<div class="alert alert-error mb-4">
					<span>{modalWeight.errorMessage}</span>
				</div>
			{/if}
			{#if modalWeight.currentEntry}
				<NumberStepper
					bind:value={modalWeight.currentEntry.amount}
					label="Current Weight"
					unit="kg"
					min={30}
					max={330}
					incrementSteps={[0.5, 1, 2, 5]}
					decrementSteps={[0.5, 1, 2, 5]}
					initialIncrementStep={1}
					initialDecrementStep={1}
					showLeftWheel={false}
				/>
			{/if}
		</fieldset>
	{/snippet}
</ModalDialog>
