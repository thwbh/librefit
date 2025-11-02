<script lang="ts">
	import Profile from '$lib/component/profile/Profile.svelte';
	import { Breadcrumbs, TextSize } from '@thwbh/veilchen';
	import type { BreadcrumbItem } from '@thwbh/veilchen';
	import { getUserContext } from '$lib/context';
	import { Gear, IdentificationCard } from 'phosphor-svelte';
	import type { LibreUser } from '$lib/api/index.js';

	let { data } = $props();

	const userContext = getUserContext();
	let userData: LibreUser = $state(userContext.user)!;
	const bodyData = data.bodyData;

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: Gear,
			iconProps: { weight: 'bold' }
		},
		{
			id: '2',
			href: '/profile',
			label: 'Profile',
			icon: IdentificationCard,
			iconProps: { weight: 'bold' }
		}
	];
</script>

<div class="p-4">
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

	<Profile bind:userData {bodyData} />
</div>
