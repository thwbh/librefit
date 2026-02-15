<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import logo from '$lib/assets/logo/librefit-logo@512x512.png';
	import { LockLaminated } from 'phosphor-svelte';
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	function start() {
		goto('/setup');
	}
</script>

<svelte:head>
	<title>Welcome to LibreFit</title>
</svelte:head>

<div class="min-h-screen bg-base-200 flex flex-col">
	<!-- Main content -->
	<div class="flex-1 flex flex-col items-center justify-center p-6 mt-8 md:p-12">
		{#if mounted}
			<!-- Logo -->
			<div class="mb-6 self-center" in:fade={{ duration: 400 }}>
				<img
					src={logo}
					alt="LibreFit"
					class="w-60 h-60 sm:w-68 sm:h-68 md:w-74 md:h-74 drop-shadow-xl"
				/>
			</div>

			<!-- App Name -->
			<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
				<h1 class="sr-only text-4xl md:text-5xl font-bold text-base-content mb-2 text-center">
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
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-sm"
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
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-sm"
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
						class="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-sm"
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
			<div class="w-full max-w-lg" in:fly={{ y: 20, duration: 400, delay: 400 }}>
				<AlertBox type={AlertType.Info} variant={AlertVariant.Callout} class="mb-6">
					{#snippet icon()}
						<LockLaminated size="1.75em" />
					{/snippet}

					<div>
						<p class="font-semibold text-info-content">Your data stays on your device</p>
						<p class="text-info-content opacity-80">No ads • No tracking • Open source</p>
					</div>
				</AlertBox>
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
			<p
				class="mt-4 text-xs text-base-content opacity-40 text-center"
				in:fade={{ duration: 400, delay: 600 }}
			>
				Version {__APP_VERSION__} • Free & Open Source
			</p>
		{/if}
	</div>
</div>
