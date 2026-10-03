<script lang="ts">
	import { onMount } from 'svelte';
	import { Sparkle } from 'phosphor-svelte';
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';
	import {
		getAiIntakeConfig,
		updateAiIntakeConfig,
		setAiIntakeApiKey,
		clearAiIntakeApiKey,
		testAiIntakeConnection,
		type AiIntakeStatus
	} from '$lib/api';
	import { aiErrorMessage } from '$lib/food-recognition';
	import { reportError } from '$lib/api/report-error';

	// Form state (non-secret). The API key is write-only: never read back from the
	// backend (FR-007), so the field starts blank and only sends when filled in.
	let enabled = $state(false);
	let baseUrl = $state('');
	let model = $state('');
	let apiKey = $state('');

	let configured = $state(false);
	let hasStoredKey = $state(false);

	let saving = $state(false);
	let testing = $state(false);
	let testResult = $state<{ ok: boolean; message: string } | null>(null);
	let errorMessage = $state<string | undefined>();

	// Deferred validation: flag fields only after the first Save/Test attempt.
	let attempted = $state(false);
	const baseUrlInvalid = $derived(attempted && enabled && baseUrl.trim().length === 0);
	const modelInvalid = $derived(attempted && enabled && model.trim().length === 0);
	const keyInvalid = $derived(attempted && enabled && apiKey.trim().length === 0 && !hasStoredKey);

	/** First validation message for the provider config, or null when complete. */
	function configError(): string | null {
		if (baseUrl.trim().length === 0) return 'Provider base URL is required.';
		if (model.trim().length === 0) return 'Model is required.';
		if (apiKey.trim().length === 0 && !hasStoredKey) return 'API key is required.';
		return null;
	}

	function applyStatus(status: AiIntakeStatus) {
		enabled = status.config.enabled;
		baseUrl = status.config.baseUrl ?? '';
		model = status.config.model ?? '';
		configured = status.configured;
		// If the feature reports configured, a key must be stored even though we
		// never read its value.
		hasStoredKey = status.configured || (hasStoredKey && apiKey === '');
	}

	onMount(async () => {
		try {
			applyStatus(await getAiIntakeConfig());
		} catch (e) {
			errorMessage = reportError(e);
		}
	});

	// Persist the current form values (key to the keystore, the rest to app_config)
	// and refresh the derived status. Shared by Save and Test, so Test always
	// validates exactly what's on screen rather than a stale persisted config.
	async function persist() {
		if (apiKey.trim().length > 0) {
			await setAiIntakeApiKey({ apiKey: apiKey.trim() });
			hasStoredKey = true;
			apiKey = '';
		}
		applyStatus(
			await updateAiIntakeConfig({
				enabled,
				baseUrl: baseUrl.trim() || undefined,
				model: model.trim() || undefined
			})
		);
	}

	async function saveConfig() {
		attempted = true;
		errorMessage = undefined;
		testResult = null;
		// Only require a full provider config when enabling; saving while disabled
		// (e.g. to turn the feature off) needs no provider.
		if (enabled) {
			const invalid = configError();
			if (invalid) {
				errorMessage = invalid;
				return;
			}
		}
		saving = true;
		try {
			await persist();
			testResult = { ok: true, message: 'Settings saved.' };
		} catch (e) {
			errorMessage = reportError(e);
		} finally {
			saving = false;
		}
	}

	async function clearKey() {
		errorMessage = undefined;
		testResult = null;
		try {
			await clearAiIntakeApiKey();
			hasStoredKey = false;
			apiKey = '';
			applyStatus(await getAiIntakeConfig());
		} catch (e) {
			errorMessage = reportError(e);
		}
	}

	async function testConnection() {
		attempted = true;
		errorMessage = undefined;
		testResult = null;
		if (!enabled) {
			testResult = { ok: false, message: 'Enable AI intake to test the connection.' };
			return;
		}
		const invalid = configError();
		if (invalid) {
			testResult = { ok: false, message: invalid };
			return;
		}
		testing = true;
		try {
			// Save first so the backend tests the values currently on screen.
			await persist();
			await testAiIntakeConnection();
			testResult = { ok: true, message: 'Connection succeeded.' };
		} catch (e) {
			testResult = { ok: false, message: aiErrorMessage(e) };
		} finally {
			testing = false;
		}
	}
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">AI Intake</h1>

	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				<span class="text-2xl font-bold">AI Intake</span>
				<span class="text-sm opacity-70">Estimate calories from a meal photo</span>
			</div>
			<span class="opacity-50">
				<Sparkle size="2.5rem" weight="duotone" />
			</span>
		</div>
	</div>

	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 p-4 pt-6 space-y-6">
		<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
			<div>
				<p class="font-semibold text-info-content">Your data stays on your device</p>
				<p>
					When enabled, a photo you take is sent from this device to your chosen provider. The photo
					is not stored, EXIF data is stripped and your key is kept in the device keystore. Local
					providers like Ollama keep everything on device. Additional billing might apply.
				</p>
			</div>
		</AlertBox>

		<!-- Enable toggle as a settings row -->
		<div class="flex items-center justify-between rounded-box bg-base-200 p-4">
			<div class="flex flex-col">
				<span class="font-semibold">Enable AI intake</span>
				<span class="text-xs opacity-60">Off by default</span>
			</div>
			<input type="checkbox" class="toggle toggle-primary" bind:checked={enabled} />
		</div>

		<!-- Provider configuration -->
		<section class="space-y-4">
			<h2 class="text-xs font-semibold uppercase tracking-wide opacity-50">Provider</h2>

			<div class="space-y-1.5">
				<label for="ai-base-url" class="text-sm font-medium">
					Base URL <span class="text-error">*</span>
				</label>
				<input
					id="ai-base-url"
					type="url"
					class="input input-bordered w-full"
					class:input-error={baseUrlInvalid}
					aria-invalid={baseUrlInvalid}
					placeholder="https://api.mistral.ai/v1"
					bind:value={baseUrl}
				/>
				{#if baseUrlInvalid}
					<p class="text-xs text-error">Provider base URL is required.</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="ai-model" class="text-sm font-medium">
					Model <span class="text-error">*</span>
				</label>
				<input
					id="ai-model"
					type="text"
					class="input input-bordered w-full"
					class:input-error={modelInvalid}
					aria-invalid={modelInvalid}
					placeholder="pixtral-12b-latest"
					bind:value={model}
				/>
				{#if modelInvalid}
					<p class="text-xs text-error">Model is required.</p>
				{:else}
					<p class="text-xs opacity-50">Use a vision-capable model for photo estimates.</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="ai-key" class="text-sm font-medium">
					API key {#if !hasStoredKey}<span class="text-error">*</span>{/if}
				</label>
				<input
					id="ai-key"
					type="password"
					class="input input-bordered w-full"
					class:input-error={keyInvalid}
					aria-invalid={keyInvalid}
					placeholder={hasStoredKey
						? '•••••••• (stored — leave blank to keep)'
						: 'Paste your API key'}
					bind:value={apiKey}
					autocomplete="off"
				/>
				{#if keyInvalid}
					<p class="text-xs text-error">API key is required.</p>
				{/if}
				{#if hasStoredKey}
					<button class="link link-error text-xs" onclick={clearKey}>Remove stored key</button>
				{/if}
			</div>
		</section>

		<!-- Actions -->
		<div class="flex flex-col gap-2 pt-1">
			<button class="btn btn-primary" onclick={saveConfig} disabled={saving || testing}>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<button class="btn" onclick={testConnection} disabled={saving || testing}>
				{testing ? 'Testing…' : 'Test connection'}
			</button>
		</div>

		{#if testResult}
			<AlertBox
				type={testResult.ok ? AlertType.Success : AlertType.Error}
				variant={AlertVariant.Box}
			>
				{testResult.message}
			</AlertBox>
		{/if}

		{#if errorMessage}
			<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{errorMessage}</AlertBox>
		{/if}

		{#if enabled && !configured}
			<p class="text-xs opacity-60">
				Add a base URL, model, and API key to finish setup. The camera button appears on the
				dashboard once AI intake is configured.
			</p>
		{/if}
	</div>
</div>
