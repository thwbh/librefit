<script lang="ts">
	import { cancelImport, importDataFile } from '$lib/api';
	import {
		ImportFormatSchema,
		type ImportProgress,
		ImportStageSchema,
		ImportTableSchema,
		type ImportResult
	} from '$lib/api/gen/types';
	import { Channel } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import { debug, error } from '@tauri-apps/plugin-log';
	import {
		AlertBox,
		AlertType,
		Breadcrumbs,
		LoadingIndicator,
		ModalDialog,
		OptionCards,
		TextSize,
		type BreadcrumbItem,
		type OptionCardData
	} from '@thwbh/veilchen';
	import { Check, Gear, Hamburger, Scales, Upload, Warning } from 'phosphor-svelte';

	const ImportFormat = ImportFormatSchema.enum;
	const ImportTable = ImportTableSchema.enum;
	const ImportStage = ImportStageSchema.enum;

	let importTarget: string = $state(ImportTable.intake);
	let selectedFilePath: string | null = $state(null);

	let dialog: HTMLDialogElement | undefined = $state();

	let importProgress: ImportProgress | undefined = $state();
	let isImporting = $state(true);

	let importTimeoutId: number | undefined = $state();
	let importResult: ImportResult | undefined = $state();
	let importStarted = $state(false);

	const importOptions: OptionCardData<string>[] = [
		{
			value: ImportTable.intake,
			header: 'Intake',
			text: 'Import intake data.'
		},
		{
			value: ImportTable.weightTracker,
			header: 'Weight',
			text: 'Import weight tracking data.'
		}
	];

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: Gear,
			iconProps: { weight: 'bold' }
		},
		{
			id: '2',
			href: '/import',
			label: 'Import Data',
			icon: Upload,
			iconProps: { weight: 'bold' }
		}
	];

	async function showFileDialog() {
		try {
			selectedFilePath = await open({
				multiple: false,
				directory: false,
				canCreateDirectories: false,
				// Android file picker has issues with CSV MIME type filtering
				// Using no filters allows broader file selection
				filters: []
			});

			debug(`Selected file path=${selectedFilePath}`);
		} catch (e) {
			error(`Error on file selection: ${e}`);
		}
	}

	async function performImport() {
		importStarted = true;
		isImporting = true;
		importProgress = undefined;
		importResult = undefined;

		try {
			const onProgress = new Channel<ImportProgress>();
			onProgress.onmessage = (progress) => {
				debug(`Import message=${progress.message}`);
				importProgress = progress;
			};

			importResult = await importDataFile({
				path: selectedFilePath!,
				targetTable: ImportTableSchema.safeParse(importTarget).data!,
				importFormat: ImportFormat.csv,
				onProgress
			});
		} catch (err) {
			error(`Import failed: ${err}`);
			importProgress = {
				stage: ImportStage.error,
				percent: 0,
				message: `Import failed: ${err}`,
				totalRows: undefined,
				rowsProcessed: undefined,
				successfulImports: 0,
				failedImports: 0
			};
		} finally {
			isImporting = false;
			importStarted = false;
		}
	}

	function showModal() {
		dialog?.showModal();

		importTimeoutId = setTimeout(() => {
			performImport();
		}, 2000) as unknown as number;
	}

	async function cancel() {
		try {
			// If import hasn't started yet, cancel the timeout
			if (!importStarted && importTimeoutId) {
				clearTimeout(importTimeoutId);
				importTimeoutId = undefined;
				closeModal();
				return;
			}

			// If import has started, request cancellation
			await cancelImport();
		} catch (err) {
			debug(`Error cancelling import: ${err}`);
		}
	}

	function closeModal() {
		dialog?.close();

		// Clear pending import timeout if exists
		if (importTimeoutId) {
			clearTimeout(importTimeoutId);
			importTimeoutId = undefined;
		}

		// Reset UI state
		isImporting = true;
		importProgress = undefined;
		importResult = undefined;
		importStarted = false;
	}
</script>

<div class="flex flex-col p-4 gap-4">
	<h1 class="sr-only">Data Import</h1>
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

	<div class="prose prose-sm max-w-none">
		<h2 class="text-lg font-semibold">Import Existing Data</h2>
		<p>
			Import your LibreFit data from CSV files. Choose a valid CSV file and select the target table
			to import into.
		</p>

		<h3 class="text-md font-medium mt-4">Available import targets:</h3>
		<ul class="list-disc list-inside text-sm space-y-1">
			<li>Calorie tracking entries (Intake)</li>
			<li>Weight tracking history</li>
		</ul>
	</div>

	<div>
		<OptionCards bind:value={importTarget} data={importOptions} scrollable={false}>
			{#snippet icon(option)}
				{#if option.value === ImportTable.intake}
					<Hamburger size="2em" />
				{:else if option.value === ImportTable.weightTracker}
					<Scales size="2em" />
				{/if}
			{/snippet}
		</OptionCards>
	</div>

	<div class="flex flex-col flex-1 gap-2">
		<span class="text-xs font-bold">Pick a file</span>
		<div class="join">
			<button class="btn btn-neutral join-item" onclick={showFileDialog}>Browse...</button>
			<input
				type="text"
				class="join-item flex-1 border border-neutral/10 p-2"
				readonly
				value={selectedFilePath}
			/>
		</div>
	</div>

	<AlertBox type={AlertType.Warning}>
		<strong>Important:</strong> Importing the same file multiple times will create duplicate entries.
		There is no automatic deduplication.
	</AlertBox>

	<button class="btn btn-primary" onclick={showModal} disabled={!selectedFilePath}> Import </button>
</div>

<ModalDialog bind:dialog>
	{#snippet title()}
		<h3 class="text-lg font-bold">Data Import</h3>
	{/snippet}
	{#snippet content()}
		<div class="import-container max-w-md mx-auto">
			<LoadingIndicator
				variant="bars"
				label={importProgress?.message ?? 'Starting...'}
				finished={!isImporting}
				error={importProgress?.stage === ImportStage.error ||
					importProgress?.stage === ImportStage.cancelled}
			>
				{#snippet finishedContent()}
					<div class="flex flex-col items-center justify-center gap-2">
						<Check size="2em" color={'var(--color-success)'} />
						<span class="text-sm opacity-70">Finished.</span>
					</div>
				{/snippet}

				{#snippet errorContent()}
					<div class="flex flex-col items-center justify-center gap-2">
						<Warning size="2em" color={'var(--color-warning)'} />
						<span class="text-sm opacity-70 wrap-normal">{importProgress?.message}</span>
					</div>
				{/snippet}
			</LoadingIndicator>

			<div class="mt-6 space-y-4">
				<!-- Status message -->
				{#if importResult}
					<AlertBox type={AlertType.Success} class="break-all wrap-normal">
						Successfully imported all {importResult.importedCount} rows.
					</AlertBox>
				{/if}

				<!-- Row processing info (when available) -->
				{#if importProgress?.totalRows && importProgress?.rowsProcessed}
					<p class="text-xs text-gray-500 font-mono">
						Processing row {importProgress.rowsProcessed}/{importProgress.totalRows}
					</p>
				{/if}

				<!-- Stage pills -->
				<div class="flex gap-2 flex-wrap">
					<span class="badge badge-sm" class:badge-success={importProgress?.percent! > 5}
						>Validating</span
					>
					<span class="badge badge-sm" class:badge-success={importProgress?.percent! > 10}
						>Parsing</span
					>
					<span class="badge badge-sm" class:badge-success={importProgress?.percent! > 15}
						>Validating Entries</span
					>
					<span class="badge badge-sm" class:badge-success={importProgress?.percent! > 60}
						>Importing</span
					>
					<span class="badge badge-sm" class:badge-success={importProgress?.percent! >= 100}
						>Done</span
					>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex flex-col gap-2">
			<button class="btn btn-error" onclick={cancel} disabled={!isImporting}>Cancel</button>
			<button class="btn" onclick={closeModal} disabled={isImporting}>Close</button>
		</div>
	{/snippet}
</ModalDialog>
