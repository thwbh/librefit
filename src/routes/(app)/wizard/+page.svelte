<script lang="ts">
	import type { LibreUser } from '$lib/api/index.js';
	import Setup from '$lib/component/wizard/Setup.svelte';
	import { getUserContext } from '$lib/context';
	import { Breadcrumbs, TextSize } from '@thwbh/veilchen';
	import type { BreadcrumbItem } from '@thwbh/veilchen';
	import { Gear, MagicWand } from 'phosphor-svelte';

	let { data } = $props();

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: Gear,
			iconProps: { weight: 'bold' }
		},
		{
			id: '2',
			href: '/wizard',
			label: 'Setup Wizard',
			icon: MagicWand,
			iconProps: { weight: 'bold' }
		}
	];

	// page is only visible with user data
	const userDataCtx = getUserContext().user!;

	// pass cloned object so context data does not get updated by accident
	// Don't type annotate - let Svelte infer the reactive proxy type
	let userData = $state({ ...userDataCtx });
</script>

<div class="flex flex-col gap-4 p-4">
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

	<Setup {userData} bodyData={data.bodyData} />
</div>
