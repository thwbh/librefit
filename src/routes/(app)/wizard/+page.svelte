<script lang="ts">
	import Setup from '$lib/component/wizard/Setup.svelte';
	import { getUserContext } from '$lib/context';
	import { Breadcrumbs, TextSize } from '@thwbh/veilchen';
	import type { BreadcrumbItem } from '@thwbh/veilchen';
	import { Gear, MagicWand } from 'phosphor-svelte';

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

	const userData = $state(getUserContext().user);
</script>

<div class="flex flex-col gap-4 p-4">
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

	<Setup {userData} />
</div>
