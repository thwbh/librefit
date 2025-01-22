<script lang="ts">
	import '../app.pcss';
	import { AppShell, Drawer, initializeStores, Modal, Toast } from '@skeletonlabs/skeleton';
	import TopBar from '$lib/components/TopBar.svelte';
	import WeightModal from '$lib/components/modal/WeightTrackerModal.svelte';
	import UserPanel from '$lib/components/UserPanel.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import AvatarModal from '$lib/components/modal/AvatarModal.svelte';
	import CalorieTrackerModal from '$lib/components/modal/CalorieTrackerModal.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	initializeStores();

	const modalComponentRegistry = {
		weightModal: {
			ref: WeightModal
		},

		avatarModal: {
			ref: AvatarModal
		},

		trackerModal: {
			ref: CalorieTrackerModal
		}
	};

	const user = writable();
	const weightTarget = writable();
	const calorieTarget = writable();
	const lastWeight = writable();
	const foodCategories = writable();

	setContext('user', user);
	setContext('weightTarget', weightTarget);
	setContext('calorieTarget', calorieTarget);
	setContext('lastWeight', lastWeight);
	setContext('foodCategories', foodCategories);

	//observeToggle(document.documentElement, (document) => {
	//	if (document.classList.contains('dark')) {
	//		$indicator = $indicator.toggle('dark');
	//	} else {
	//		$indicator = $indicator.toggle('light');
	//	}
	//});
</script>

<Toast position={'tr'} />
<Modal components={modalComponentRegistry} />
<Drawer position={'right'}>
	<UserPanel />
</Drawer>

<AppShell>
	{#snippet header()}
		{#if $user}
			<TopBar />
		{/if}
	{/snippet}
	<!-- Router Slot -->
	{@render children?.()}
	<!-- ---- / ---- -->
	{#snippet pageFooter()}
		{#if $user}
			<div class="text-center">
				<p class="unstyled text-xs">&copy; {new Date().getFullYear()} tohuwabohu.io</p>
			</div>
		{/if}
	{/snippet}
</AppShell>
