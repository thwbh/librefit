<script>
    import CalorieDistribution from '$lib/components/CalorieDistribution.svelte';
    import {getContext} from 'svelte';
    import {goto} from '$app/navigation';
    import {DataViews, enumKeys} from '$lib/enum.ts';
    import {getToastStore, RadioGroup, RadioItem} from '@skeletonlabs/skeleton';
    import {listCaloriesFiltered} from '$lib/api/tracker.ts';
    import {showToastError} from '$lib/toast.ts';
    import NoFood from '$lib/assets/icons/food-off.svg?component'
    import {getFoodCategoryLongvalue, skimCategories} from '$lib/api/category';

    export let data;

    const toastStore = getToastStore();

    /** @type List<CalorieTracker> */
    const calorieTracker = data.caloriesMonthList;

    /** @type Writable<LibreUser> */
    const user = getContext('user');

    const indicator = getContext('indicator');

    /** @type Writable<List<FoodCategory>> */
    const foodCategories = getContext('foodCategories');

    /** @type Writable<CalorieTarget> */
    const calorieTarget = getContext('calorieTarget');

    if (!$user) goto('/');

    let filter = DataViews.Month;
    let filteredData;
    let categories;

    $: if(calorieTracker) {
        filteredData = calorieTracker;
        categories = skimCategories(calorieTracker);
    }

    const loadEntriesFiltered = async () => {
        $indicator = $indicator.start();

        await listCaloriesFiltered(filter).then(result => {
            /** @type Array<WeightTracker> */
            filteredData = result;
        }).catch(e => showToastError(toastStore, e)).finally(() => $indicator = $indicator.finish());
    }

    /**
     * @param calorieTracker {Array<CalorieTracker>}
     * @param category {string}
     */
    const calculateAverage = (calorieTracker, category) => {
        const filtered = calorieTracker.filter(entry => entry.category === category)
        const total = filtered.map(entry => entry.amount).reduce((part, a) => part + a, 0);

        return Math.round(total / filtered.length);
    }

    /**
     * @param calorieTracker {Array<CalorieTracker>}
     * @param category {string}
     */
    const findMinimum = (calorieTracker, category) => {
        return Math.min(...calorieTracker.filter(entry => entry.category === category).map(entry => entry.amount));
    }

    /**
     * @param calorieTracker {Array<CalorieTracker>}
     * @param category {string}
     */
    const findMaximum = (calorieTracker, category) => {
        return Math.max(...calorieTracker.filter(entry => entry.category === category).map(entry => entry.amount))
    }

</script>

{#if $user}
<section>
    <div class="container mx-auto p-8 space-y-10">
        <h1 class="h1">
            Calorie Distribution
        </h1>
        <div class="flex flex-col gap-4">
            <RadioGroup>
                {#each enumKeys(DataViews) as dataView}
                    <RadioItem bind:group={filter}
                               name="justify"
                               value={DataViews[dataView]}
                               on:change={loadEntriesFiltered}>
                        {dataView}
                    </RadioItem>
                {/each}
            </RadioGroup>

            {#if calorieTracker.length > 0 }
                <div class="flex flex-col lg:flex-row gap-4">
                    <div class="lg:w-3/5 flex flex-col">
                        <h2 class="h2">Last {filter.toLowerCase()}:</h2>
                        <div class="table-container">
                            <table class="table table-hover table-compact table-auto w-full align-middle">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Avg.</th>
                                        <th>Min.</th>
                                        <th>Max.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each categories as category}
                                        <tr>
                                            <td>
                                                {getFoodCategoryLongvalue($foodCategories, category)}
                                            </td>
                                            <td>
                                                kcal {calculateAverage(filteredData, category)}
                                            </td>
                                            <td>
                                                kcal {findMinimum(filteredData, category)}
                                            </td>
                                            <td>
                                                kcal {findMaximum(filteredData, category)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="lg:w-2/5 flex justify-center">
                        <CalorieDistribution displayClass="flex"
                                calorieTracker={filteredData}
                                displayHeader={false}
                                displayHistory={false}
                                foodCategories={$foodCategories}
                                bind:calorieTarget={$calorieTarget}
                        />
                    </div>
                </div>
            {:else}
                <div class="flex flex-col items-center text-center gap-4">
                    <NoFood width={100} height={100}/>
                    <p>
                        Insufficient data to render your history.
                    </p>
                </div>
            {/if}
        </div>
    </div>
</section>
{/if}