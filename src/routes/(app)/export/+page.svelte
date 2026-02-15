<script lang="ts">
	import { cancelExport, exportDatabaseFile, type ExportProgress } from '$lib/api';
	import { ExportFormatSchema, ExportStageSchema } from '$lib/api/gen/types';
	import { Channel } from '@tauri-apps/api/core';
	import { save } from '@tauri-apps/plugin-dialog';
	import { writeFile } from '@tauri-apps/plugin-fs';
	import { debug } from '@tauri-apps/plugin-log';
	import {
		AlertBox,
		AlertType,
		AlertVariant,
		LoadingIndicator,
		ModalDialog,
		OptionCards,
		type OptionCardData
	} from '@thwbh/veilchen';
	import {
		ArrowClockwise,
		Check,
		Coffee,
		Database,
		Eyeglasses,
		FileCsv,
		FilePdf,
		FloppyDisk,
		MagnifyingGlass,
		TreeStructure,
		Warning
	} from 'phosphor-svelte';

	const ExportStage = ExportStageSchema.enum;
	const ExportFormat = ExportFormatSchema.enum;

	const exportOptions: OptionCardData<string>[] = [
		{
			value: ExportFormat.csv,
			header: 'CSV',
			text: 'The export provides zipped CSV files to be processed with a tabular calculation tool.'
		},
		{
			value: ExportFormat.raw,
			header: 'Raw',
			text: 'The export creates a SQLite database file that you can store safely or use to restore your data later.'
		}

		/*		{
			value: 'pdf',
			header: 'PDF',
			text: 'The export provides a PDF report, presenting your data as interpolated charts.'
		} */
	];

	const exportExtensions = new Map([
		[ExportFormat.raw, 'db'],
		[ExportFormat.csv, 'zip']
		//		[ExportFormat.pdf, 'pdf']
	]);

	let exportProgress = $state(0);
	let exportMessage = $state('Working...');
	let exportStage = $state('');
	let filePath: string | null = $state(null);
	let isExporting = $state(true);
	let bytesInfo = $state('');

	let exportFormat = $state(ExportFormat.csv);

	let dialog: HTMLDialogElement | undefined = $state();

	const stageIcons = {
		[ExportStage.initializing]: Coffee,
		[ExportStage.analyzingDatabase]: MagnifyingGlass,
		[ExportStage.creatingBackup]: FloppyDisk,
		[ExportStage.readingFile]: Eyeglasses,
		[ExportStage.finalizing]: ArrowClockwise,
		[ExportStage.complete]: Check,
		[ExportStage.cancelled]: Warning,
		[ExportStage.error]: Warning
	};

	let stageIcon = $derived.by(() => {
		const value = ExportStageSchema.safeParse(exportStage).data!;

		return stageIcons[value];
	});

	let exportStarted = $state(false);

	async function exportDatabase() {
		exportStarted = true;
		isExporting = true;
		exportProgress = 0;
		exportMessage = 'Starting...';
		exportStage = '';
		bytesInfo = '';

		try {
			const onProgress = new Channel<ExportProgress>();

			onProgress.onmessage = (progress) => {
				exportProgress = progress.percent;
				exportMessage = progress.message;

				debug(`Export message=${exportMessage}`);

				exportStage = ExportStageSchema.safeParse(progress.stage).data!;

				if (progress.bytesProcessed !== undefined && progress.totalBytes !== undefined) {
					const percent = ((progress.bytesProcessed / progress.totalBytes) * 100).toFixed(1);
					bytesInfo = `${percent}% (${formatBytes(progress.bytesProcessed)} / ${formatBytes(progress.totalBytes)})`;
				} else {
					bytesInfo = '';
				}
			};

			const data = await exportDatabaseFile({
				exportFormat,
				onProgress
			});

			filePath = await save({
				defaultPath: data.filePath,
				filters: [{ name: 'SQLite Database', extensions: [exportExtensions.get(exportFormat)!] }]
			});

			debug(`Export to selected file path=${filePath}`);

			if (!filePath) {
				exportMessage = 'Cancelled.';
				exportStage = ExportStage.error;
			}

			if (filePath) {
				await writeFile(filePath, new Uint8Array(data.bytes));
				exportMessage = `Saved to ${filePath}`;
			}
		} catch (error) {
			console.error('Export failed:', error);
			exportMessage = `Export failed: ${error}`;
			exportStage = ExportStage.error;
		} finally {
			isExporting = false;
			exportStarted = false;
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	let exportTimeoutId: number | undefined = $state();

	function showModal() {
		dialog?.showModal();

		exportTimeoutId = setTimeout(() => {
			exportDatabase();
		}, 2000) as unknown as number;
	}

	async function cancel() {
		try {
			// If export hasn't started yet, cancel the timeout
			if (!exportStarted && exportTimeoutId) {
				clearTimeout(exportTimeoutId);
				exportTimeoutId = undefined;
				closeModal();
				return;
			}

			// If export has started, request cancellation
			await cancelExport();
		} catch (error) {
			debug(`Error cancelling export: ${error}`);
		}
	}

	function closeModal() {
		dialog?.close();

		// Clear pending export timeout if exists
		if (exportTimeoutId) {
			clearTimeout(exportTimeoutId);
			exportTimeoutId = undefined;
		}

		// Reset UI state
		isExporting = true;
		exportProgress = 0;
		exportMessage = 'Working...';
		exportStage = '';
		filePath = null;
		bytesInfo = '';
		exportStarted = false;
	}
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Data Export</h1>

	<!-- Branded Header -->
	<div class="bg-primary text-primary-content px-6 pt-8 pb-14">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				<span class="text-2xl font-bold">Export Data</span>
				<span class="text-sm opacity-70">Back up your LibreFit data</span>
			</div>
			<span class="opacity-50">
				<TreeStructure size="2.5rem" weight="duotone" />
			</span>
		</div>
	</div>

	<!-- Content card with overlap -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 p-4 pt-6 flex flex-col gap-4">
		<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
			<span class="font-bold">Your data, your control</span>
			<span>
				Export a complete backup of your LibreFit data. This includes all your tracked meals, weight
				entries, targets, and personal settings.
			</span>
		</AlertBox>

		<div class="rounded-box border border-base-300 overflow-hidden">
			<div class="bg-base-200/50 px-4 py-3 border-b border-base-300">
				<h3 class="text-sm font-semibold text-base-content tracking-wide">What's included</h3>
			</div>
			<div class="divide-y divide-base-200">
				<div class="flex items-center gap-3 px-4 py-3">
					<span class="list-caret"></span>
					<span class="text-sm text-base-content/80">All calorie tracking entries</span>
				</div>
				<div class="flex items-center gap-3 px-4 py-3">
					<span class="list-caret"></span>
					<span class="text-sm text-base-content/80">Weight history and targets</span>
				</div>
				<div class="flex items-center gap-3 px-4 py-3">
					<span class="list-caret"></span>
					<span class="text-sm text-base-content/80">Your profile and body data</span>
				</div>
				<div class="flex items-center gap-3 px-4 py-3">
					<span class="list-caret"></span>
					<span class="text-sm text-base-content/80">Custom settings and preferences</span>
				</div>
			</div>
		</div>

		<div>
			<OptionCards bind:value={exportFormat} data={exportOptions} scrollable={false}>
				{#snippet icon(option)}
					{#if option.value === 'raw'}
						<Database size="2em" />
					{:else if option.value === 'csv'}
						<FileCsv size="2em" />
					{:else if option.value === 'pdf'}
						<FilePdf size="2em" />
					{/if}
				{/snippet}
			</OptionCards>
		</div>

		<button class="btn btn-primary w-full" onclick={showModal}> Start Export </button>
	</div>
</div>

<ModalDialog bind:dialog>
	{#snippet title()}
		<h3 class="text-lg font-bold">Data Export</h3>
	{/snippet}
	{#snippet content()}
		<div class="export-container max-w-md mx-auto">
			<LoadingIndicator
				variant="bars"
				label={exportMessage}
				finished={!isExporting}
				error={exportStage === ExportStage.error || exportStage === ExportStage.cancelled}
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
						<span class="text-sm opacity-70 wrap-normal">{exportMessage}</span>
					</div>
				{/snippet}
			</LoadingIndicator>

			<div class="mt-6 space-y-4">
				<!-- Status message -->
				{#if filePath}
					<AlertBox type={AlertType.Info} variant={AlertVariant.Callout} class="break-all">
						File saved to {filePath}
					</AlertBox>
				{/if}

				<!-- Bytes info (when available) -->
				{#if bytesInfo}
					<p class="text-xs text-gray-500 font-mono">{bytesInfo}</p>
				{/if}

				<!-- Stage pills -->
				<div class="flex gap-2 flex-wrap">
					<span class="badge badge-sm" class:badge-success={exportProgress > 5}>Initialize</span>
					<span class="badge badge-sm" class:badge-success={exportProgress > 10}>Analyze</span>
					<span class="badge badge-sm" class:badge-success={exportProgress > 60}>Backup</span>
					<span class="badge badge-sm" class:badge-success={exportProgress > 95}>Read</span>
					<span class="badge badge-sm" class:badge-success={exportProgress >= 100}>Done</span>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex flex-col gap-2">
			<button class="btn btn-error" onclick={cancel} disabled={!isExporting}>Cancel</button>
			<button class="btn" onclick={closeModal} disabled={isExporting}>Close</button>
		</div>
	{/snippet}
</ModalDialog>

<style>
	.list-caret {
		display: inline-block;
		width: 1rem;
		height: 0.625rem;
		flex-shrink: 0;
		background-color: var(--color-accent);
		clip-path: polygon(
			0% 0%,
			calc(100% - 0.25rem) 0%,
			100% 50%,
			calc(100% - 0.25rem) 100%,
			0% 100%
		);
	}
</style>
