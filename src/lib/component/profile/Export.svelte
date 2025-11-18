<script lang="ts">
	import { exportDatabaseFile, type ExportProgress } from '$lib/api';
	import { ExportStageSchema, type ExportStage } from '$lib/api/gen/types';
	import { Channel } from '@tauri-apps/api/core';
	import { save } from '@tauri-apps/plugin-dialog';
	import { writeFile } from '@tauri-apps/plugin-fs';
	import {
		ArrowClockwise,
		Check,
		Coffee,
		Eyeglasses,
		FloppyDisk,
		MagnifyingGlass,
		Warning
	} from 'phosphor-svelte';

	const ExportStage = ExportStageSchema.enum;

	let exportProgress = $state(0);
	let exportMessage = $state('');
	let exportStage = $state('');
	let isExporting = $state(false);
	let bytesInfo = $state('');

	const stageIcons = {
		[ExportStage.initializing]: Coffee,
		[ExportStage.analyzingDatabase]: MagnifyingGlass,
		[ExportStage.creatingBackup]: FloppyDisk,
		[ExportStage.readingFile]: Eyeglasses,
		[ExportStage.finalizing]: ArrowClockwise,
		[ExportStage.complete]: Check,
		[ExportStage.error]: Warning
	};

	let stageIcon = $derived(stageIcons[exportStage as ExportStage]);

	async function exportDatabase() {
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
				exportStage = ExportStageSchema.safeParse(progress.stage).data!;

				if (progress.bytesProcessed !== undefined && progress.totalBytes !== undefined) {
					const percent = ((progress.bytesProcessed / progress.totalBytes) * 100).toFixed(1);
					bytesInfo = `${percent}% (${formatBytes(progress.bytesProcessed)} / ${formatBytes(progress.totalBytes)})`;
				} else {
					bytesInfo = '';
				}
			};

			const data = await exportDatabaseFile({
				onProgress
			});

			const filePath = await save({
				defaultPath: data.filePath,
				filters: [{ name: 'SQLite Database', extensions: ['db'] }]
			});

			if (filePath) {
				await writeFile(filePath, new Uint8Array(data.bytes));
				exportMessage = `Saved to ${filePath}`;
			}
		} catch (error) {
			console.error('Export failed:', error);
			exportMessage = `Export failed: ${error}`;
			exportStage = ExportStage.error;
		} finally {
			/* setTimeout(() => {
				isExporting = false;
			}, 2000); */
			// Keep the UI visible for 2 seconds after completion
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}
</script>

<div class="export-container p-6 max-w-md mx-auto">
	<button class="btn btn-primary w-full" onclick={exportDatabase} disabled={isExporting}>
		{#if isExporting}
			Exporting...
		{:else}
			Export Database
		{/if}
	</button>

	<!--	{#if isExporting} -->
	<div class="mt-6 space-y-4">
		<!-- Stage indicator -->
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">
				{#if exportStage}
					{@const IconComponent = stageIcon}
					<IconComponent />
				{/if}
			</span>
			<span class="text-sm font-mono text-gray-600">{exportProgress.toFixed(1)}%</span>
		</div>

		<!-- Progress bar -->
		<div class="relative">
			<progress class="progress progress-primary w-full h-3" value={exportProgress} max="100"
			></progress>

			<!-- Animated shimmer effect for active progress -->
			{#if exportProgress < 100}
				<div class="absolute inset-0 overflow-hidden rounded-full">
					<div
						class="h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
					></div>
				</div>
			{/if}
		</div>

		<!-- Status message -->
		<p class="text-sm text-gray-700">{exportMessage}</p>

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
	<!--	{/if} -->
</div>

<style>
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}

	.animate-shimmer {
		animation: shimmer 2s infinite;
	}
</style>
