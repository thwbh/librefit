<script>
    import FilterComponent from '$lib/components/FilterComponent.svelte';
    import {getContext} from 'svelte';
    import {deleteWeight, listWeightRange, updateWeight} from '$lib/api/tracker.ts';
    import {showToastError, showToastSuccess, showToastWarning} from '$lib/toast.ts';
    import {goto} from '$app/navigation';
    import {getToastStore, Paginator} from '@skeletonlabs/skeleton';
    import ScaleOff from '$lib/assets/icons/scale-outline-off.svg';
    import TrackerInput from '$lib/components/TrackerInput.svelte';
    import {validateAmount} from '$lib/validation.ts';
    import {convertDateStrToDisplayDateStr} from '$lib/date.ts';
    import {subDays} from 'date-fns';

    const toastStore = getToastStore();
    const indicator = getContext('indicator');
    const user = getContext('user');

    if (!$user) goto('/');

    export let data;

    let weightList = [];
    let paginatedSource = [];

    let toDate = new Date();
    let fromDate = subDays(toDate, 6);

    $: weightList;

    let paginationSettings = {
        page: 0,
        limit: 7,
        size: data.weightWeekList.length,
        amounts: [1, 7, 14, 31],
    }

    $: if (data) {
        weightList = data.weightWeekList;
    }

    $: paginatedSource = weightList.slice(
        paginationSettings.page * paginationSettings.limit,
        paginationSettings.page * paginationSettings.limit + paginationSettings.limit
    );

    const onFilterChanged = async (event) => {
        fromDate = event.detail.from;
        toDate = event.detail.to;

        if (fromDate && toDate) {
            await reload(fromDate, toDate);
        }
    }

    const reload = async (fromDate, toDate) => {
        $indicator = $indicator.start();

        await listWeightRange(fromDate, toDate).then(async response => {
            if (response.ok) {
                weightList = await response.json();
                paginationSettings.size = weightList.length;
            } else throw response
        }).catch((e) => { showToastError(toastStore, e) }).finally(() => $indicator = $indicator.finish())
    }

    const updateWeightEntry = async (event) => {
        const amountMessage = validateAmount(event.detail.value);

        if (!amountMessage) {
            $indicator = $indicator.start(event.detail.target);

            await updateWeight(event).then(async response => {
                event.detail.callback();

                showToastSuccess(toastStore, 'Successfully updated weight.')

                await reload(fromDate, toDate);
            }).catch((e) => {
                showToastError(toastStore, e);
                event.detail.callback(true);
            }).finally(() => $indicator = $indicator.finish());
        } else {
            showToastWarning(toastStore, amountMessage);
            event.detail.callback(true);
        }
    }

    const deleteWeightEntry = async (event) => {
        $indicator = $indicator.start(event.detail.target);

        await deleteWeight(event).then(async _ => {
            event.detail.callback();

            showToastSuccess(toastStore, `Deletion successful.`);

            await reload(fromDate, toDate);
        }).catch((e) => {
            showToastError(toastStore, e);
            event.detail.callback(true);
        }).finally(() => $indicator = $indicator.finish())
    }
</script>

<style>
    td {
        vertical-align: middle !important;
    }
</style>

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
                        <FilterComponent on:change={onFilterChanged} />
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
                                    <TrackerInput compact={true}
                                                  value={entry.amount}
                                                  dateStr={entry.added}
                                                  sequence={entry.sequence}
                                                  category={entry.category}
                                                  on:update={updateWeightEntry}
                                                  on:remove={deleteWeightEntry}
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
                    <ScaleOff width={100} height={100}/>
                    <p>
                        Insufficient data to render your history. Start tracking now on the <a href="/dashboard">Dashboard</a>!
                    </p>
                    <p>
                        Are you trying to add tracking data for the past? Don't worry, the <a href="/import">CSV Import</a>
                        is the right tool for that.
                    </p>
                </div>
            {/if}
        {:else}
            {data.error}
        {/if}
    </div>
</section>
{/if}