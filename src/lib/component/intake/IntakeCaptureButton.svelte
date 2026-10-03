<script lang="ts">
	import { Camera } from 'phosphor-svelte';
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';
	import { analyzeMealPhoto, grantAiIntakeConsent, type NewIntake } from '$lib/api';
	import { aiErrorMessage, fileToBytes } from '$lib/food-recognition';
	import AiConsentModal from './AiConsentModal.svelte';

	// Camera entry point for AI meal-photo intake (FR / IT-033..035). Rendered only
	// when the feature is available (enabled + configured + online); the webview only
	// transports image bytes — the key and endpoint live in the backend (FR-008).
	interface Props {
		/** enabled && configured && online — the button is hidden otherwise. */
		available: boolean;
		/** Whether one-time consent has already been granted (FR-016). */
		consentGranted: boolean;
		/** Provider endpoint, shown in the consent dialog for transparency. */
		endpoint?: string;
		/** Candidate pre-fills the intake mask; nothing is saved until confirmed. */
		onresult: (intake: NewIntake, lowConfidence: boolean) => void;
		/** Fired after consent is granted so the parent can update its state. */
		onconsent?: () => void;
	}

	let { available, consentGranted, endpoint, onresult, onconsent }: Props = $props();

	let fileInput = $state<HTMLInputElement>();
	let loading = $state(false);
	let showConsent = $state(false);
	let errorMessage = $state<string | undefined>();

	function handleClick() {
		errorMessage = undefined;
		if (!consentGranted) {
			showConsent = true;
			return;
		}
		openPicker();
	}

	function openPicker() {
		fileInput?.click();
	}

	async function acceptConsent() {
		showConsent = false;
		try {
			await grantAiIntakeConsent();
			onconsent?.();
			openPicker();
		} catch (e) {
			errorMessage = aiErrorMessage(e);
		}
	}

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Reset immediately so picking the same file again re-triggers change.
		input.value = '';
		if (!file) return;

		loading = true;
		errorMessage = undefined;
		try {
			const image = await fileToBytes(file);
			const locale = navigator.language?.split('-')[0] || 'en';
			const candidate = await analyzeMealPhoto({
				image,
				mime: file.type || 'image/jpeg',
				locale
			});
			onresult(candidate.intake, candidate.lowConfidence);
		} catch (e) {
			errorMessage = aiErrorMessage(e);
		} finally {
			loading = false;
		}
	}
</script>

{#if available}
	<button
		class="btn btn-circle btn-secondary shadow-lg"
		onclick={handleClick}
		disabled={loading}
		aria-label="Estimate calories from a photo"
	>
		{#if loading}
			<span class="loading loading-spinner"></span>
		{:else}
			<Camera size="1.5rem" weight="bold" />
		{/if}
	</button>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		capture="environment"
		class="hidden"
		onchange={handleFileChange}
	/>

	{#if errorMessage}
		<div class="fixed bottom-24 left-4 right-4 z-50">
			<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{errorMessage}</AlertBox>
		</div>
	{/if}

	{#if showConsent}
		<AiConsentModal {endpoint} onaccept={acceptConsent} oncancel={() => (showConsent = false)} />
	{/if}
{/if}
