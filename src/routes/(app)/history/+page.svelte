<script lang="ts">
	import {
		type Intake,
		type IntakeTarget,
		type NewIntake,
		type NewWeightTracker,
		type TrackerHistory,
		type WeightTracker,
		type WorkoutDetail,
		type ExerciseDetail
	} from '$lib/api';
	import { getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import { dayBoundsUtc, workedMuscles, type WorkedMuscle } from '$lib/workout/history';
	import { addDays, compareAsc, subDays } from 'date-fns';
	import WeightModal from '$lib/component/weight/WeightModal.svelte';
	import HistoryDayCard from '$lib/component/history/HistoryDayCard.svelte';
	import HistoryWeek from '$lib/component/history/HistoryWeek.svelte';
	import WorkoutHistoryModal from '$lib/component/workout/WorkoutHistoryModal.svelte';
	import WorkoutDeleteDialog from '$lib/component/workout/WorkoutDeleteDialog.svelte';
	import { vibrate } from '@tauri-apps/plugin-haptics';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		createIntake,
		createWeightTrackerEntry,
		deleteIntake,
		deleteWorkout,
		getBodyData,
		getExerciseLibrary,
		getTrackerHistory,
		listWorkouts,
		updateIntake,
		updateWeightTrackerEntry
	} from '$lib/api/gen/commands.js';
	import { debug } from '@tauri-apps/plugin-log';
	import IntakeModal from '$lib/component/intake/IntakeModal.svelte';
	import WorkoutEditModal from '$lib/component/workout/WorkoutEditModal.svelte';
	import { workoutStore } from '$lib/workout/workout-state.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

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

	// Workouts aren't part of TrackerHistory; fetch the selected day's completed
	// workouts on demand so the Activity section tracks day navigation ([HI-016]).
	let dayWorkouts = $state<WorkoutDetail[]>([]);
	let selectedWorkout = $state<WorkoutDetail | null>(null);

	// The exercise library (loaded once) lets us derive each workout's worked
	// muscles for the card silhouette ([HI-017]); WorkoutDetail doesn't carry them.
	let library = $state<ExerciseDetail[]>([]);
	$effect(() => {
		if (library.length === 0) getExerciseLibrary().then((l) => (library = l));
	});
	// Body model for the muscle silhouettes; resolved from the profile.
	let gender = $state<'male' | 'female'>('male');
	$effect(() => {
		getBodyData()
			.then((b) => (gender = b.sex?.toUpperCase() === 'FEMALE' ? 'female' : 'male'))
			.catch(() => {});
	});
	let libraryById = $derived(new Map(library.map((e) => [e.id, e])));
	let workoutMuscles = $derived(
		new Map<number, WorkedMuscle[]>(
			dayWorkouts.map((w) => [w.session.id, workedMuscles(w, libraryById)])
		)
	);

	const todayStr = getDateAsStr(new Date());
	let isToday = $derived(selectedDateStr === todayStr);

	const loadDayWorkouts = async (dateStr: string) => {
		const { from, to } = dayBoundsUtc(dateStr);
		// list_workouts returns most-recent-first; history shows the day's workouts
		// in chronological order ([HI-018]).
		dayWorkouts = (await listWorkouts({ from, to })).sort((a, b) =>
			a.session.startedAt.localeCompare(b.session.startedAt)
		);
	};

	$effect(() => {
		// Re-run whenever the selected day changes.
		loadDayWorkouts(selectedDateStr);
	});

	const tapWorkout = (workout: WorkoutDetail) => {
		selectedWorkout = workout;
	};

	// Delete via swipe-right → confirmation dialog ([HI-021], `_conv-gestures` GES-004).
	let workoutToDelete = $state<WorkoutDetail | null>(null);
	const requestDeleteWorkout = async (workout: WorkoutDetail) => {
		await vibrate(2);
		workoutToDelete = workout;
	};
	const confirmDeleteWorkout = async () => {
		if (!workoutToDelete) return;
		await deleteWorkout({ sessionId: workoutToDelete.session.id });
		workoutToDelete = null;
		await loadDayWorkouts(selectedDateStr);
	};

	// Flat-CRUD editor: add a past workout / edit a completed one ([HI-020], [HI-022]).
	let editor = $state<{ mode: 'create' | 'edit'; detail: WorkoutDetail | null } | null>(null);

	// Today → start a live session ([HI-023]); past → open the flat-CRUD editor.
	const addOrStartWorkout = async () => {
		await vibrate(2);
		if (isToday) {
			try {
				await workoutStore.start();
				await goto('/');
			} catch (e) {
				debug(`start workout from history failed: ${e}`);
			}
		} else {
			editor = { mode: 'create', detail: null };
		}
	};

	// Edit via swipe-left / long-press ([HI-020]).
	const editWorkout = async (workout: WorkoutDetail) => {
		await vibrate(2);
		editor = { mode: 'edit', detail: workout };
	};

	const closeEditor = async () => {
		editor = null;
		await loadDayWorkouts(selectedDateStr);
	};

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

	<!-- Header + week pager -->
	<HistoryWeek
		{dates}
		{selectedDateStr}
		{showRightCaret}
		caloriesAverage={trackerHistory.caloriesAverage}
		onselect={selectHistory}
		onweekchange={(direction) => (direction === 'previous' ? scrollLeft() : scrollRight())}
	/>

	<!-- Content -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col p-4 pt-6">
		{#key selectedDateStr}
			<div in:fly={flyParams} out:fly={{ x: -flyParams.x, duration: 150, easing: cubicOut }}>
				<HistoryDayCard
					{intakeTarget}
					intakeEntries={intakeHistory}
					weightEntries={weightHistory}
					workoutEntries={dayWorkouts}
					{isToday}
					ondayswipe={handleDaySwipe}
					oneditintake={edit}
					ondeleteintake={remove}
					onaddintake={modal.openCreate}
					oneditweight={editWeight}
					oncreateweight={createWeight}
					ontapworkout={tapWorkout}
					oneditworkout={editWorkout}
					ondeleteworkout={requestDeleteWorkout}
					onaddworkout={addOrStartWorkout}
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

<!-- Workout detail modal — view only ([HI-019]); edit/delete are card-swipe gestures. -->
{#if selectedWorkout}
	<WorkoutHistoryModal
		detail={selectedWorkout}
		muscles={workoutMuscles.get(selectedWorkout.session.id) ?? []}
		{gender}
		onclose={() => (selectedWorkout = null)}
	/>
{/if}

<!-- Delete confirmation ([HI-021], GES-004 / MOD-002). -->
{#if workoutToDelete}
	<WorkoutDeleteDialog
		detail={workoutToDelete}
		onconfirm={confirmDeleteWorkout}
		oncancel={() => (workoutToDelete = null)}
	/>
{/if}

<!-- Flat-CRUD editor: add a past workout ([HI-022]) / edit a completed one ([HI-020]). -->
{#if editor}
	<WorkoutEditModal
		mode={editor.mode}
		dateStr={selectedDateStr}
		detail={editor.detail}
		{gender}
		onsaved={() => loadDayWorkouts(selectedDateStr)}
		onclose={closeEditor}
	/>
{/if}
