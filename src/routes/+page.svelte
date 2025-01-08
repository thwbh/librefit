<script lang="ts">
	import { goto } from '$app/navigation';
	import FirstSetupComponent from '$lib/components/FirstSetupComponent.svelte';
	import type { LibreUser } from '$lib/model';

	export let data: { userData: LibreUser };

	if (!data.userData) {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>LibreFit</title>
</svelte:head>

<section class="h-full flex">
	<FirstSetupComponent />
</section>
