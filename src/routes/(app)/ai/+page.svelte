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
		saving = true;
		errorMessage = undefined;
		testResult = null;
		try {
			await persist();
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
		testing = true;
		testResult = null;
		errorMessage = undefined;
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
		<p class="text-sm opacity-70">
			Opt-in and bring your own key. When enabled, a photo you take is sent directly from this
			device to your chosen provider — never to a LibreFit server. The photo is not stored, and your
			key is kept in the device keystore. Local providers like Ollama keep everything on device.
			Vision calls cost a few cents on your own billing.
		</p>

		<div class="form-control">
			<label class="label cursor-pointer justify-between">
				<span class="label-text font-semibold">Enable AI intake</span>
				<input type="checkbox" class="toggle toggle-primary" bind:checked={enabled} />
			</label>
		</div>

		<label class="form-control w-full">
			<span class="label-text">Provider base URL</span>
			<input
				type="url"
				class="input input-bordered w-full"
				placeholder="https://api.mistral.ai/v1"
				bind:value={baseUrl}
			/>
		</label>

		<label class="form-control w-full">
			<span class="label-text">Model</span>
			<input
				type="text"
				class="input input-bordered w-full"
				placeholder="pixtral-12b-latest"
				bind:value={model}
			/>
		</label>

		<label class="form-control w-full">
			<span class="label-text">API key</span>
			<input
				type="password"
				class="input input-bordered w-full"
				placeholder={hasStoredKey
					? '•••••••• (stored — leave blank to keep)'
					: 'Paste your API key'}
				bind:value={apiKey}
				autocomplete="off"
			/>
			{#if hasStoredKey}
				<button class="btn btn-ghost btn-xs mt-1 self-start" onclick={clearKey}
					>Remove stored key</button
				>
			{/if}
		</label>

		<div class="flex gap-2">
			<button class="btn btn-primary flex-1" onclick={saveConfig} disabled={saving}>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<button class="btn flex-1" onclick={testConnection} disabled={testing}>
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
