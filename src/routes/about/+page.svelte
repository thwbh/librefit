<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import logo from '$lib/assets/logo/librefit-logo.png';
	import { LockLaminated, LockSimple } from 'phosphor-svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	function start() {
		goto('/wizard');
	}
</script>

<svelte:head>
	<title>Welcome to LibreFit</title>
</svelte:head>

<div class="min-h-screen bg-base-200 flex flex-col">
	<!-- Main content -->
	<div class="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
		{#if mounted}
			<!-- Logo -->
			<div class="mb-8" in:fade={{ duration: 400 }}>
				<img src={logo} alt="LibreFit" class="w-32 h-32 md:w-40 md:h-40 drop-shadow-xl" />
			</div>

			<!-- App Name -->
			<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
				<h1 class="text-5xl md:text-6xl font-bold text-base-content mb-2 text-center">LibreFit</h1>
				<div class="w-20 h-1 bg-primary mx-auto mb-6"></div>
			</div>

			<!-- Tagline -->
			<p
				class="text-xl md:text-2xl text-base-content opacity-70 mb-12 text-center max-w-md"
				in:fly={{ y: 20, duration: 400, delay: 200 }}
			>
				Track smarter. Live healthier.
			</p>

			<!-- Feature Cards -->
			<div
				class="bg-base-100 rounded-2xl shadow-lg p-8 md:p-10 mb-8 max-w-lg w-full space-y-6"
				in:fly={{ y: 20, duration: 400, delay: 300 }}
			>
				<!-- Feature 1 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1 text-lg">Personalized calorie goals</h3>
						<p class="text-sm text-base-content opacity-60">
							Science-based recommendations tailored to your body and goals
						</p>
					</div>
				</div>

				<!-- Feature 2 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1 text-lg">
							Beautiful progress tracking
						</h3>
						<p class="text-sm text-base-content opacity-60">
							Visualize your journey with detailed charts and insights
						</p>
					</div>
				</div>

				<!-- Feature 3 -->
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold"
					>
						✓
					</div>
					<div>
						<h3 class="font-semibold text-base-content mb-1 text-lg">Simple daily tracking</h3>
						<p class="text-sm text-base-content opacity-60">
							Log your meals in seconds, not minutes
						</p>
					</div>
				</div>
			</div>

			<!-- Privacy Badge -->
			<div
				class="bg-info border border-info-content/20 rounded-xl px-6 py-4 mb-8 max-w-lg w-full"
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

			<!-- CTA Button -->
			<button
				class="btn btn-neutral rounded-xl px-12 py-5 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-lg flex items-center justify-center gap-2 shadow-lg"
				onclick={start}
				in:fly={{ y: 20, duration: 400, delay: 500 }}
			>
				<span>Get Started</span>
				<span class="text-xl">→</span>
			</button>

			<!-- Version -->
			<p class="text-xs text-base-content opacity-40 mt-8" in:fade={{ duration: 400, delay: 600 }}>
				Version 0.1.0-beta • Free & Open Source
			</p>
		{/if}
	</div>
</div>
