<script lang="ts">
	import { getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import { CaretLeft, CaretRight } from 'phosphor-svelte';
	import NumberFlow from '@number-flow/svelte';
	import { useSwipe } from 'svelte-gestures';

	interface Props {
		dates: string[];
		selectedDateStr: string;
		/** Whether next-week navigation is available (false at the latest week). */
		showRightCaret: boolean;
		caloriesAverage: number;
		onselect: (dateStr: string) => void;
		onweekchange: (direction: 'previous' | 'next') => void;
	}

	let { dates, selectedDateStr, showRightCaret, caloriesAverage, onselect, onweekchange }: Props =
		$props();

	const selectedDate = $derived(selectedDateStr ? parseStringAsDate(selectedDateStr) : null);
	const monthLabel = $derived(selectedDate ? getDateAsStr(selectedDate, 'MMMM yyyy') : '');

	function getActiveClass(dateStr: string) {
		return dateStr === selectedDateStr
			? 'bg-primary-content text-primary'
			: 'text-primary-content/70 hover:bg-primary-content/10';
	}

	function handleWeekSwipe(event: CustomEvent) {
		const direction = event.detail.direction;
		if (direction === 'left' && showRightCaret) {
			onweekchange('next');
		} else if (direction === 'right') {
			onweekchange('previous');
		}
	}
</script>

<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
	{#if selectedDateStr}
		<div class="flex items-center justify-between">
			<span class="text-3xl font-bold">{monthLabel}</span>
			<div class="flex flex-col items-end">
				<span class="text-2xl font-bold">
					<NumberFlow value={caloriesAverage} />
				</span>
				<span class="text-xs opacity-70">avg kcal/day</span>
			</div>
		</div>
	{/if}

	<!-- Date selector -->
	<div
		class="grid grid-cols-9 gap-1 mt-6"
		{...useSwipe(handleWeekSwipe, () => ({
			timeframe: 300,
			minSwipeDistance: 60,
			touchAction: 'pan-y'
		}))}
	>
		<button
			class="place-self-center opacity-70 hover:opacity-100"
			aria-label="Previous week"
			onclick={() => onweekchange('previous')}
		>
			<CaretLeft size="1.25em" />
		</button>

		{#each dates as dateStr}
			{@const dayNumber = getDateAsStr(parseStringAsDate(dateStr), 'dd')}
			{@const dayName = getDateAsStr(parseStringAsDate(dateStr), 'EE')}
			<button
				onclick={() => onselect(dateStr)}
				class="rounded-field flex flex-col items-center px-2 py-1 transition-colors {getActiveClass(
					dateStr
				)}"
			>
				<span class="text-sm font-semibold">{dayNumber}</span>
				<span class="text-[10px] font-semibold opacity-60">{dayName}</span>
			</button>
		{/each}

		{#if showRightCaret}
			<button
				class="place-self-center opacity-70 hover:opacity-100"
				aria-label="Next week"
				onclick={() => onweekchange('next')}
			>
				<CaretRight size="1.25em" />
			</button>
		{:else}
			<div></div>
		{/if}
	</div>
</div>
