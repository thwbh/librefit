<script lang="ts">
	import { Breadcrumbs, TextSize } from '@thwbh/veilchen';
	import type { BreadcrumbItem } from '@thwbh/veilchen';
	import { Gear, Info } from 'phosphor-svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import logo from '$lib/assets/logo/librefit-logo.png';
	import { LockLaminated } from 'phosphor-svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: Gear,
			iconProps: { weight: 'bold' }
		},
		{
			id: '2',
			href: '/about',
			label: 'About',
			icon: Info,
			iconProps: { weight: 'bold' }
		}
	];
</script>

<svelte:head>
	<title>About LibreFit</title>
</svelte:head>

<div class="p-4">
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold mb-4" />

	<div class="flex flex-col">
		{#if mounted}
			<!-- Logo -->
			<div class="mb-6 self-center" in:fade={{ duration: 400 }}>
				<img src={logo} alt="LibreFit" class="w-24 h-24 md:w-32 md:h-32 drop-shadow-xl" />
			</div>

			<!-- App Name -->
			<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
				<h1 class="text-4xl md:text-5xl font-bold text-base-content mb-2 text-center">
					LibreFit
				</h1>
				<div class="w-16 h-1 bg-primary mx-auto mb-4"></div>
			</div>

			<!-- Tagline -->
			<p
				class="text-lg md:text-xl text-base-content opacity-70 mb-8 text-center max-w-md mx-auto"
				in:fly={{ y: 20, duration: 400, delay: 200 }}
			>
				Track smarter. Live healthier.
			</p>

			<!-- Feature Cards -->
			<div
				class="bg-base-100 rounded-2xl shadow-lg p-6 md:p-8 mb-6 max-w-lg mx-auto w-full space-y-4"
				in:fly={{ y: 20, duration: 400, delay: 300 }}
			>
				<!-- Feature 1 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1">Personalized calorie goals</h3>
						<p class="text-sm text-base-content opacity-60">
							Science-based recommendations tailored to your body and goals
						</p>
					</div>
				</div>

				<!-- Feature 2 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1">Beautiful progress tracking</h3>
						<p class="text-sm text-base-content opacity-60">
							Visualize your journey with detailed charts and insights
						</p>
					</div>
				</div>

				<!-- Feature 3 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1">Simple daily tracking</h3>
						<p class="text-sm text-base-content opacity-60">
							Log your meals in seconds, not minutes
						</p>
					</div>
				</div>
			</div>

			<!-- Privacy Badge -->
			<div
				class="bg-info border border-info-content/20 rounded-xl px-5 py-3 mb-6 max-w-lg mx-auto w-full"
				in:fly={{ y: 20, duration: 400, delay: 400 }}
			>
				<div class="flex items-center gap-3 text-sm">
					<span class="text-2xl">
						<LockLaminated size="1em" />
					</span>
					<div>
						<p class="font-semibold text-info-content">Your data stays on your device</p>
						<p class="text-info-content opacity-80">No ads • No tracking • Open source</p>
					</div>
				</div>
			</div>

			<!-- Version -->
			<p class="text-xs text-base-content opacity-40 text-center" in:fade={{ duration: 400, delay: 500 }}>
				Version 0.1.0-beta • Free & Open Source
			</p>
		{/if}
	</div>
</div>
