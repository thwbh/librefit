<script lang="ts">
	import type { LibreUser } from '$lib/api/gen';
	import { AlertBox, AlertType, Avatar } from '@thwbh/veilchen';
	import { fade } from 'svelte/transition';
	import { getAvatar } from '$lib/avatar';

	interface Props {
		isProcessing: boolean;
		processingStep: string;
		hasError: boolean;
		isFadingOut: boolean;
		userInput: LibreUser;
		onRetry: () => void;
	}

	let { isProcessing, processingStep, hasError, isFadingOut, userInput, onRetry }: Props = $props();

	let avatarSrc = $derived(getAvatar(userInput.avatar!));
</script>

<div
	class="fixed inset-0 z-50 bg-base-100 flex items-center justify-center transition-opacity duration-1000"
	class:opacity-0={isFadingOut}
	transition:fade={{ duration: 300 }}
>
	<div class="max-w-md w-full px-6">
		<div class="flex flex-col items-center justify-center gap-8">
			<!-- Icon/Animation -->
			{#if isProcessing}
				<span class="loading loading-spinner loading-lg text-primary w-24 h-24"></span>
			{:else if !hasError}
				<div class="animate-bounce">
					<Avatar src={avatarSrc} size="2xl" ring ringColor="ring-secondary" />
				</div>
			{/if}

			<!-- Title -->
			<div class="text-center space-y-2">
				<h1 class="text-3xl font-bold text-base-content">
					{#if hasError}
						Setup Failed
					{:else if isProcessing}
						Setting Up Your Profile
					{:else}
						Welcome Aboard!
					{/if}
				</h1>

				{#if hasError}
					<AlertBox type={AlertType.Error}>
						<strong>Error</strong>
						<span>{processingStep}</span>
					</AlertBox>
				{:else}
					<p class="text-lg text-base-content opacity-70">{processingStep}</p>
				{/if}
			</div>

			<!-- Progress indicator (only show during processing) -->
			{#if isProcessing && !hasError}
				<div class="w-full max-w-xs">
					<progress class="progress progress-primary w-full"></progress>
				</div>
			{/if}

			<!-- Retry button (only show on error) -->
			{#if hasError}
				<div class="flex gap-4">
					<button class="btn btn-primary" onclick={onRetry}>
						<span>Try Again</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
