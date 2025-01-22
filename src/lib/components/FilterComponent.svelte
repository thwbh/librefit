<script lang="ts">
	import { getDateAsStr, parseStringAsDate } from '$lib/date';
	import { subDays } from 'date-fns';

	interface Props {
		onFilterChanged: (from: Date, to: Date) => void;
	}

	let { onFilterChanged }: Props = $props();

	const today = new Date();

	let toDateStr = $state(getDateAsStr(today));
	let fromDateStr = $state(getDateAsStr(subDays(today, 6)));

	let filterSelection = $state('w');

	const filterOptions = [
		{ value: 'w', label: 'last 7 days' },
		{ value: 'm', label: 'last 31 days' },
		{ value: 'c', label: 'date between' }
	];

	const onFilter = () => {
		if (filterSelection === 'w') {
			fromDateStr = getDateAsStr(subDays(today, 6));
			toDateStr = getDateAsStr(today);
		} else if (filterSelection === 'm') {
			fromDateStr = getDateAsStr(subDays(today, 30));
			toDateStr = getDateAsStr(today);
		}

		if (filterSelection !== 'c') {
			onFilterChanged(parseStringAsDate(fromDateStr), parseStringAsDate(toDateStr));
		}
	};

	const onDateChanged = () => {
		const fromDate = parseStringAsDate(fromDateStr);
		const toDate = parseStringAsDate(toDateStr);

		// can't swap without triggering another change event
		if (fromDate > toDate) {
			onFilterChanged(toDate, fromDate);
		} else {
			onFilterChanged(fromDate, toDate);
		}
	};
</script>

<div class="flex md:flex-row flex-col gap-4 items-center">
	<div class="flex flex-row gap-4 items-center">
		<p>Show</p>
		<div>
			<select class="select" bind:value={filterSelection} onchange={onFilter}>
				{#each filterOptions as filterOption}
					<option value={filterOption.value}>{filterOption.label}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="flex flex-row gap-4 {filterSelection !== 'c' ? 'hidden' : ''}">
		<label class="flex flex-row gap-4 items-center">
			<span class="hidden" aria-hidden="true"> from </span>

			<input bind:value={fromDateStr} class="input" type="date" onchange={onDateChanged} />
		</label>

		<label class="flex flex-row gap-4 items-center">
			<span> and </span>

			<input bind:value={toDateStr} class="input" type="date" onchange={onDateChanged} />
		</label>
	</div>
</div>
