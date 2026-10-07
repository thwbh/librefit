<script lang="ts">
	import { Camera } from 'phosphor-svelte';
	import { analyzeMealPhoto, grantAiIntakeConsent, type IntakeCandidate } from '$lib/api';
	import { aiErrorMessage, capturePhotoFromCamera, fileToBytes } from '$lib/food-recognition';
	import AiConsentModal from './AiConsentModal.svelte';

	// Camera entry point for AI meal-photo intake (FR / IT-033..035). Rendered only
	// when the feature is available (enabled + configured + online); the webview only
	// transports image bytes — the key and endpoint live in the backend (FR-008).
	//
	// Tapping opens the device camera directly via tauri-plugin-camera (FR-031/032).
	// There is no in-app chooser — the OS camera owns the capture UI. On desktop (or
	// if the camera is unavailable) it falls back silently to the file picker so AI
	// intake still works off-device (FR-033). The button owns no loading or error
	// surface — it emits lifecycle callbacks so the parent can drive the in-modal
	// loading state and the failure-recovery snackbar.
	interface Props {
		/** enabled && configured && online — the button is hidden otherwise. */
		available: boolean;
		/** Whether one-time consent has already been granted (FR-016). */
		consentGranted: boolean;
		/** Provider endpoint, shown in the consent dialog for transparency. */
		endpoint?: string;
		/** Fired when analysis begins (bytes in hand) so the parent can open the loading modal. */
		onstart: () => void;
		/** A produced candidate pre-fills the intake mask; nothing is saved until confirmed. */
		onresult: (candidate: IntakeCandidate) => void;
		/** Fired with a user-facing message when capture/analysis fails. */
		onerror: (message: string) => void;
		/** Fired after consent is granted so the parent can update its state. */
		onconsent?: () => void;
	}

	let { available, consentGranted, endpoint, onstart, onresult, onerror, onconsent }: Props =
		$props();

	let fileInput = $state<HTMLInputElement>();
	let showConsent = $state(false);

	function handleClick() {
		if (!consentGranted) {
			showConsent = true;
			return;
		}
		capture();
	}

	async function acceptConsent() {
		showConsent = false;
		try {
			await grantAiIntakeConsent();
			onconsent?.();
			capture();
		} catch (e) {
			onerror(aiErrorMessage(e));
		}
	}

	// Open the device camera. On desktop (or if the plugin is unavailable) the invoke
	// rejects, so fall back to the file picker — capture degrades rather than
	// dead-ending (FR-033).
	async function capture() {
		let captured;
		try {
			captured = await capturePhotoFromCamera();
		} catch {
			fileInput?.click();
			return;
		}
		await runAnalysis(captured.image, captured.mime);
	}

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Reset immediately so picking the same file again re-triggers change.
		input.value = '';
		if (!file) return;

		const image = await fileToBytes(file);
		await runAnalysis(image, file.type || 'image/jpeg');
	}

	// Analysis is in flight from here: tell the parent to open the loading modal
	// (FR-036), then hand back the candidate (FR-025) or a failure message (FR-028..030).
	async function runAnalysis(image: number[], mime: string) {
		onstart();
		try {
			const locale = navigator.language?.split('-')[0] || 'en';
			const candidate = await analyzeMealPhoto({ image, mime, locale });
			onresult(candidate);
		} catch (e) {
			onerror(aiErrorMessage(e));
		}
	}
</script>

{#if available}
	<button
		class="btn btn-xl btn-circle btn-primary shadow-lg"
		onclick={handleClick}
		aria-label="Estimate calories from a photo"
	>
		<Camera size="1.5rem" weight="bold" />
	</button>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileChange}
	/>

	{#if showConsent}
		<AiConsentModal {endpoint} onaccept={acceptConsent} oncancel={() => (showConsent = false)} />
	{/if}
{/if}
