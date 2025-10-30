<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '@thwbh/veilchen';
	import type { BottomNavItem } from '@thwbh/veilchen';
	import { ChartLine, DotsThreeVertical, House, ListBullets } from 'phosphor-svelte';
	import Settings from '$lib/component/settings/Settings.svelte';

	let { children } = $props();

	let isSettingsOpen = $state(false);

	const navItems: BottomNavItem[] = [
		{
			id: 'home',
			label: 'Home',
			href: '/',
			icon: House,
			iconProps: { size: '1.25em' }
		},
		{
			id: 'progress',
			label: 'Progress',
			href: '/progress',
			icon: ChartLine,
			iconProps: { size: '1.25em' }
		},
		{
			id: 'history',
			label: 'History',
			href: '/history',
			icon: ListBullets,
			iconProps: { size: '1.25em' }
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: DotsThreeVertical,
			iconProps: { size: '1.25em' },
			onclick: () => {
				isSettingsOpen = !isSettingsOpen;
			}
		}
	];

	const activeId = $derived(
		navItems.find(
			(item) =>
				page.url.pathname === item.href ||
				(page.url.pathname.startsWith(item.href) && item.href !== '/')
		)?.id
	);
</script>

<AppShell items={navItems} {activeId}>
	{@render children()}
</AppShell>

<Settings bind:open={isSettingsOpen} />
