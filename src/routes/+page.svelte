<script lang="ts">
	import DashboardComponent from '$lib/components/DashboardComponent.svelte';
	import FirstSetupComponent from '$lib/components/FirstSetupComponent.svelte';
	import type { Dashboard, FoodCategory, LibreUser } from '$lib/model';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const dashboardData: Dashboard = data.dashboardData;

	const foodCategories: Writable<Array<FoodCategory>> = getContext('foodCategories');
	foodCategories.set(dashboardData.foodCategories);

	const user: Writable<LibreUser> = getContext('user');
	user.set(dashboardData.userData);
</script>

<svelte:head>
	<title>LibreFit</title>
</svelte:head>

<section class="h-full flex">
	{#if dashboardData}
		{@const userData = dashboardData.userData}
		{#if userData}
			<DashboardComponent {dashboardData} />
		{:else}
			<FirstSetupComponent />
		{/if}
	{/if}
</section>
