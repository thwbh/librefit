<script lang="ts">
	import { page } from '$app/state';
	import { AppShell, ToastContainer, createRefreshContext } from '@thwbh/veilchen';
	import type { BottomNavItem } from '@thwbh/veilchen';
	import Settings from '$lib/component/settings/Settings.svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { afterNavigate } from '$app/navigation';
	import JournalIcon from '$lib/component/navigation/JournalIcon.svelte';
	import ProgressIcon from '$lib/component/navigation/ProgressIcon.svelte';
	import SettingsIcon from '$lib/component/navigation/SettingsIcon.svelte';
	import HistoryIcon from '$lib/component/navigation/HistoryIcon.svelte';

	let { children } = $props();

	// Scroll to top after navigation completes (after transition)
	afterNavigate(() => {
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	});

	let isSettingsOpen = $state(false);

	const navItems: BottomNavItem[] = [
		{
			id: 'home',
			label: 'Home',
			href: '/',
			/*			icon: House,*/
			icon: JournalIcon,
			iconProps: { size: '1.25em', weight: 'bold' }
		},
		{
			id: 'progress',
			label: 'Progress',
			href: '/progress',
			icon: ProgressIcon,
			iconProps: { size: '1.25em', weight: 'bold' }
		},
		{
			id: 'history',
			label: 'History',
			href: '/history',
			icon: HistoryIcon,
			iconProps: { size: '1.25em', weight: 'bold' }
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: SettingsIcon,
			iconProps: { size: '1.25em', weight: 'bold' },
			onclick: () => {
				isSettingsOpen = !isSettingsOpen;
			}
		}
	];

	const refresh = createRefreshContext();

	const activeId = $derived(
		navItems.find(
			(item) =>
				item.href &&
				(page.url.pathname === item.href ||
					(page.url.pathname.startsWith(item.href) && item.href !== '/'))
		)?.id
	);
</script>

<ToastContainer position="top" align="center" />

<AppShell items={navItems} {activeId} onrefresh={refresh.handler} refreshing={refresh.isRefreshing}>
	{#key page.url.pathname}
		<div
			in:fade={{ duration: 150, delay: 100, easing: cubicOut }}
			out:fade={{ duration: 100, easing: cubicOut }}
		>
			{@render children()}
		</div>
	{/key}
</AppShell>

<Settings bind:open={isSettingsOpen} />

<style>
	:global(.dock-item .indicator) {
		fill: var(--color-secondary);
	}

	:global(.dock-active .indicator) {
		fill: var(--color-accent);
	}

	:global(.breadcrumb-link .indicator) {
		fill: var(--color-accent);
	}
</style>
