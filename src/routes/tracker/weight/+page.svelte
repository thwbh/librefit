<script lang="ts">
	import FilterComponent from '$lib/components/FilterComponent.svelte';
	import { getContext } from 'svelte';
	import { deleteWeight, listWeightRange, updateWeight } from '$lib/api/tracker';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getToastStore, Paginator } from '@skeletonlabs/skeleton';
	import ScaleOff from '$lib/assets/icons/scale-outline-off.svg?component';
	import TrackerInput from '$lib/components/TrackerInput.svelte';
	import { validateAmount } from '$lib/validation';
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { subDays } from 'date-fns';
	import type { Writable } from 'svelte/store';
	import type { LibreUser, WeightTracker } from '$lib/model.js';
	import type { TrackerInputEvent } from '$lib/event';

	const toastStore = getToastStore();
	const user: Writable<LibreUser> = getContext('user');

	let { data } = $props();

	let weightList = $state([]);
	let paginatedSource = $state([]);

	let toDate = new Date();
	let fromDate = subDays(toDate, 6);

	let paginationSettings = $state({
		page: 0,
		limit: 7,
		size: data.weightWeekList.length,
		amounts: [1, 7, 14, 31]
	});

	$effect(() => {
		if (data) {
			weightList = data.weightWeekList;
		}

		paginatedSource = weightList.slice(
			paginationSettings.page * paginationSettings.limit,
			paginationSettings.page * paginationSettings.limit + paginationSettings.limit
		);
	});

	const onFilterChanged = async (fromDate: Date, toDate: Date) => {
		if (fromDate && toDate) {
			await reload(fromDate, toDate);
		}
	};

	const reload = async (fromDate: Date, toDate: Date) => {
		await listWeightRange(fromDate, toDate)
			.then((response) => {
				weightList = response;
				paginationSettings.size = weightList.length;
			})
			.catch((e) => {
				showToastError(toastStore, e);
			});
	};

	const updateWeightEntry = async (event: TrackerInputEvent<WeightTracker>) => {
		const amountMessage = validateAmount(event.details.amount);

		if (!amountMessage) {
			const weight: WeightTracker = {
				id: event.details.id,
				amount: event.details.amount,
				added: event.details.added
			};

			await updateWeight(weight)
				.then(async (_) => {
					event.buttonEvent.callback();

					showToastSuccess(toastStore, 'Successfully updated weight.');

					await reload(fromDate, toDate);
				})
				.catch((e) => {
					showToastError(toastStore, e);
					event.buttonEvent.callback();
				});
		} else {
			showToastWarning(toastStore, amountMessage);
			event.buttonEvent.callback();
		}
	};

	const deleteWeightEntry = async (event: TrackerInputEvent<WeightTracker>) => {
		const weight: WeightTracker = {
			id: event.details.id,
			added: event.details.added,
			amount: event.details.amount
		};

		await deleteWeight(weight)
			.then(async (_) => {
				event.buttonEvent.callback();

				showToastSuccess(toastStore, `Deletion successful.`);

				await reload(fromDate, toDate);
			})
			.catch((e) => {
				showToastError(toastStore, e);
				event.buttonEvent.callback();
			});
	};
</script>

<svelte:head>
	<title>LibreFit - Weight Tracker</title>
</svelte:head>

{#if $user}
	<section>
		<div class="container mx-auto p-8 space-y-10">
			<h1 class="h1">Weight History</h1>

			{#if data.weightWeekList}
				{#if weightList.length > 0}
					<div class=" overflow-x-auto space-y-2">
						<header>
							<FilterComponent {onFilterChanged} />
						</header>
						<table class="table table-hover table-compact table-auto w-full align-middle">
							<thead>
								<tr>
									<th>Date</th>
									<th>Amount</th>
								</tr>
							</thead>
							<tbody>
								{#each paginatedSource as entry}
									<tr>
										<td>
											<span class="align-middle">
												{convertDateStrToDisplayDateStr(entry.added)}
											</span>
										</td>
										<td>
											<TrackerInput
												compact={true}
												value={entry.amount}
												dateStr={entry.added}
												category={entry.category}
												onUpdate={updateWeightEntry}
												onDelete={deleteWeightEntry}
												existing={entry.sequence !== undefined}
												disabled={entry.sequence !== undefined}
												placeholder={''}
												unit={'kg'}
												maxWidthCss="max-sm:max-w-12"
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<footer>
							<!-- <RowCount {handler} /> -->
							<Paginator
								bind:settings={paginationSettings}
								showFirstLastButtons={false}
								showPreviousNextButtons={true}
							/>
						</footer>
					</div>
				{:else}
					<div class="flex flex-col items-center text-center gap-4">
						<ScaleOff width={100} height={100} />
						<p>
							Insufficient data to render your history. Start tracking now on the <a
								href="/dashboard">Dashboard</a
							>!
						</p>
						<p>
							Are you trying to add tracking data for the past? Don't worry, the <a href="/import"
								>CSV Import</a
							>
							is the right tool for that.
						</p>
					</div>
				{/if}
			{/if}
		</div>
	</section>
{/if}

<style>
	td {
		vertical-align: middle !important;
	}
</style>
