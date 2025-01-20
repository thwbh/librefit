<script lang="ts">
	import TrackerRadial from '$lib/components/TrackerRadial.svelte';
	import { getDateAsStr, getDaytimeFoodCategory } from '$lib/date';
	import Plus from '$lib/assets/icons/plus.svg?component';
	import Edit from '$lib/assets/icons/pencil.svg?component';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import TrackerInput from '$lib/components/TrackerInput.svelte';
	import type { CalorieTarget, CalorieTracker, FoodCategory, NewCalorieTracker } from '$lib/model';
	import type { TrackerInputEvent } from '$lib/event';

	const modalStore = getModalStore();

	interface Props {
		calorieTracker?: Array<CalorieTracker>;
		categories: Array<FoodCategory>;
		calorieTarget: CalorieTarget;
		onAddCalories?: (newCalories: NewCalorieTracker, callback: () => void) => void;
		onUpdateCalories?: (calories: CalorieTracker, callback: () => void) => void;
		onDeleteCalories?: (calories: CalorieTracker, callback: () => void) => void;
	}

	let {
		calorieTracker = [],
		categories,
		calorieTarget,
		onAddCalories,
		onUpdateCalories,
		onDeleteCalories
	}: Props = $props();

	let caloriesQuickAdd: number = $state(0);

	const addCaloriesQuickly = (event: TrackerInputEvent<NewCalorieTracker>) => {
		// take default category based on time
		const now = new Date();

		const newCalories: NewCalorieTracker = {
			added: getDateAsStr(now),
			amount: caloriesQuickAdd,
			category: getDaytimeFoodCategory(now),
			description: ''
		};

		onAddCalories(newCalories, event.buttonEvent.callback);
	};

	const addCalories = (event: TrackerInputEvent<NewCalorieTracker>) => {
		const newCalories: NewCalorieTracker = event.details;

		onAddCalories(newCalories, event.buttonEvent.callback);
	};

	const updateCalories = (event: TrackerInputEvent<CalorieTracker>) => {
		const calories: CalorieTracker = event.details;

		onUpdateCalories(calories, event.buttonEvent.callback);
	};

	const deleteCalories = (event: TrackerInputEvent<CalorieTracker>) => {
		const calories: CalorieTracker = event.details;

		onDeleteCalories(calories, event.buttonEvent.callback);
	};

	const openModal = () => {
		modalStore.trigger({
			type: 'component',
			component: 'trackerModal',
			meta: {
				categories: categories
			},
			response: (e: TrackerInputEvent<NewCalorieTracker>) => {
				if (e) {
					if (e) addCalories(e);
					modalStore.close();
				} else modalStore.close();
			}
		});
	};

	const onEdit = () => {
		modalStore.trigger({
			type: 'component',
			component: 'trackerModal',
			meta: {
				entries: calorieTracker,
				categories: categories
			},
			response: (e) => {
				if (e) {
					if (e.detail.type === 'update') updateCalories(e.detail);
					else if (e.detail.type === 'remove') deleteCalories(e.detail);

					if (e.detail.close) modalStore.close();
				} else modalStore.close();
			}
		});
	};

	const calculateDeficit = (entries: Array<CalorieTracker>, target: CalorieTarget): number => {
		const total = entries.reduce((totalCalories, entry) => totalCalories + entry.amount, 0);

		return total - target.targetCalories;
	};
</script>

<div class="flex flex-col gap-4 justify-between text-center h-full xl:w-80">
	<h2 class="h3">Calorie Tracker</h2>
	<div class="flex flex-col w-fit h-full justify-between gap-4 pt-4">
		<div class="self-center">
			<TrackerRadial
				entries={calorieTracker.map((e: CalorieTracker) => e.amount)}
				{calorieTarget}
			/>
		</div>
		{#if calorieTarget}
			{@const deficit = calculateDeficit(calorieTracker, calorieTarget)}
			<div>
				{#if deficit < 0}
					<p>You still have {Math.abs(deficit)}kcal left for the day. Good job!</p>
				{:else if deficit === 0}
					<p>A spot landing. How did you even do that? There's {deficit}kcal left.</p>
				{:else if deficit > 0 && deficit + calorieTarget.targetCalories <= calorieTarget.maximumCalories}
					<p>You exceeded your daily target by {deficit}kcal. Days like these happen.</p>
				{:else}
					<p>
						With a {deficit}kcal surplus, you reached the red zone. Eating over your TDEE causes
						long term weight gain.
					</p>
				{/if}
			</div>
		{/if}
		<div>
			<TrackerInput
				bind:value={caloriesQuickAdd}
				onAdd={addCaloriesQuickly}
				dateStr={getDateAsStr(new Date())}
				compact={true}
				unit={'kcal'}
			/>
		</div>
	</div>

	<div class="flex">
		<div class="btn-group variant-filled w-fit grow">
			<button class="w-1/2" aria-label="add calories" onclick={() => openModal()}>
				<span>
					<Plus />
				</span>
				<span> Add </span>
			</button>
			<button class="w-1/2" aria-label="edit calories" onclick={() => onEdit()}>
				<span>
					<Edit />
				</span>
				<span> Edit </span>
			</button>
		</div>
	</div>
</div>
