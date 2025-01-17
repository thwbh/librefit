<script lang="ts">
	import { getDashboard } from '$lib/api/user';
	import DashboardComponent from '$lib/components/DashboardComponent.svelte';
	import FirstSetupComponent from '$lib/components/FirstSetupComponent.svelte';
</script>

<svelte:head>
	<title>LibreFit</title>
</svelte:head>

<section class="h-full flex">
	{#await getDashboard(new Date()) then dashboardData}
		{@const userData = dashboardData.userData}
		{#if userData}
			<DashboardComponent {dashboardData} />
		{:else}
			<FirstSetupComponent />
		{/if}
	{/await}
</section>
