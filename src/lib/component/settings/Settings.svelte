<script lang="ts">
	import { fly } from 'svelte/transition';
	import { IdentificationCard, TreeStructure, Upload, MagicWand, Info } from 'phosphor-svelte';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	const close = () => (open = false);

	const items = [
		{ href: '/profile', label: 'Profile', icon: IdentificationCard },
		{ href: '/export', label: 'Export', icon: TreeStructure },
		{ href: '/import', label: 'Import', icon: Upload },
		{ href: '/wizard', label: 'Wizard', icon: MagicWand },
		{ href: '/about', label: 'About', icon: Info }
	];
</script>

{#if open}
	<!-- Backdrop -->
	<button class="fixed inset-0 z-40" onclick={close} aria-label="Close menu"></button>

	<!-- Settings menu -->
	<div
		class="fixed bottom-20 right-4 z-50 bg-base-100 rounded-box shadow-xl border border-base-300 p-2 w-fit"
		transition:fly={{ y: 10, duration: 200 }}
	>
		<ul class="menu menu-sm gap-0.5 p-0">
			{#each items as item}
				<li>
					<a href={item.href} onclick={close} class="flex items-center gap-3 rounded-lg">
						<item.icon size="1.125rem" weight="bold" class="opacity-60" />
						<span class="text-sm">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}
