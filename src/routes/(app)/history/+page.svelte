<script lang="ts">
	import {
		type Intake,
		type IntakeTarget,
		type NewIntake,
		type NewWeightTracker,
		type TrackerHistory,
		type WeightTracker
	} from '$lib/api';
	import { getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import NumberFlow from '@number-flow/svelte';
	import { addDays, compareAsc, subDays } from 'date-fns';
	import { CaretLeft, CaretRight } from 'phosphor-svelte';
	import WeightModal from '$lib/component/weight/WeightModal.svelte';
	import HistoryDayCard from '$lib/component/history/HistoryDayCard.svelte';
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
	import IntakeModal from '$lib/component/intake/IntakeModal.svelte';

	let { data } = $props();

	const foodCategories = getCategoriesContext();

	// default history is 1 week
	let trackerHistory: TrackerHistory = $state(data.trackerHistory);
	let intakeTarget: IntakeTarget = data.intakeTarget;
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
			<div in:fly={flyParams} out:fly={{ x: -flyParams.x, duration: 150, easing: cubicOut }}>
				<HistoryDayCard
					{intakeTarget}
					intakeEntries={intakeHistory}
					weightEntries={weightHistory}
					ondayswipe={handleDaySwipe}
					oneditintake={edit}
					ondeleteintake={remove}
					onaddintake={modal.openCreate}
					oneditweight={editWeight}
					oncreateweight={createWeight}
				/>
			</div>
		{/key}
	</div>
</div>

<!-- Create Intake modal -->
<IntakeModal
	bind:dialog={modal.createDialog.value}
	bind:entry={modal.currentEntry}
	mode="create"
	errorMessage={modal.errorMessage}
	onsave={modal.save}
	oncancel={modal.cancel}
/>

<!-- Edit Intake modal — no trash button (history has swipe-to-delete on the row) -->
<IntakeModal
	bind:dialog={modal.editDialog.value}
	bind:entry={modal.currentEntry}
	mode="edit"
	errorMessage={modal.errorMessage}
	onsave={modal.save}
	oncancel={modal.cancel}
/>

<!-- Delete Intake modal (swipe-to-delete direct entry) -->
<IntakeModal
	bind:dialog={modal.deleteDialog.value}
	bind:entry={modal.currentEntry}
	mode="delete"
	errorMessage={modal.errorMessage}
	oncancel={modal.cancel}
	ondelete={modal.deleteEntry}
/>

<!-- Create WeightTracker modal -->
<WeightModal
	bind:dialog={modalWeight.createDialog.value}
	bind:entry={modalWeight.currentEntry}
	errorMessage={modalWeight.errorMessage}
	incrementSteps={[0.5, 1, 2, 5, 20, 50]}
	decrementSteps={[0.5, 1, 2, 5, 20, 50]}
	onsave={modalWeight.save}
	oncancel={modalWeight.cancel}
/>

<!-- Edit WeightTracker modal -->
<WeightModal
	bind:dialog={modalWeight.editDialog.value}
	bind:entry={modalWeight.currentEntry}
	errorMessage={modalWeight.errorMessage}
	onsave={modalWeight.save}
	oncancel={modalWeight.cancel}
/>
