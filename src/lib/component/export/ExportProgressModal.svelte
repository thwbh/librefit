<script lang="ts">
	import { ExportStageSchema } from '$lib/api/gen/types';
	import {
		AlertBox,
		AlertType,
		AlertVariant,
		LoadingIndicator,
		ModalDialog
	} from '@thwbh/veilchen';
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

	interface Props {
		dialog?: HTMLDialogElement;
		message: string;
		stage: string;
		progress: number;
		isExporting: boolean;
		filePath: string | null;
		bytesInfo: string;
		oncancel: () => void;
		onclose: () => void;
	}

	let {
		dialog = $bindable(),
		message,
		stage,
		progress,
		isExporting,
		filePath,
		bytesInfo,
		oncancel,
		onclose
	}: Props = $props();

	const stageIcon = $derived.by(() => {
		const value = ExportStageSchema.safeParse(stage).data;
		return value ? stageIcons[value] : null;
	});
</script>

<ModalDialog bind:dialog>
	{#snippet title()}
		<h3 class="text-lg font-bold">Data Export</h3>
	{/snippet}
	{#snippet content()}
		<div class="export-container max-w-md mx-auto">
			{#if isExporting && stageIcon}
				{@const Icon = stageIcon}
				<div class="flex justify-center mb-3" data-testid="stage-icon">
					<Icon size="2em" weight="duotone" />
				</div>
			{/if}

			<LoadingIndicator
				variant="bars"
				label={message}
				finished={!isExporting}
				error={stage === ExportStage.error || stage === ExportStage.cancelled}
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
						<span class="text-sm opacity-70 wrap-normal">{message}</span>
					</div>
				{/snippet}
			</LoadingIndicator>

			<div class="mt-6 space-y-4">
				{#if filePath}
					<AlertBox type={AlertType.Info} variant={AlertVariant.Callout} class="break-all">
						File saved to {filePath}
					</AlertBox>
				{/if}

				{#if bytesInfo}
					<p class="text-xs text-gray-500 font-mono">{bytesInfo}</p>
				{/if}

				<div class="flex gap-2 flex-wrap">
					<span class="badge badge-sm" class:badge-success={progress > 5}>Initialize</span>
					<span class="badge badge-sm" class:badge-success={progress > 10}>Analyze</span>
					<span class="badge badge-sm" class:badge-success={progress > 60}>Backup</span>
					<span class="badge badge-sm" class:badge-success={progress > 95}>Read</span>
					<span class="badge badge-sm" class:badge-success={progress >= 100}>Done</span>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex flex-col gap-2">
			<button class="btn btn-error" onclick={oncancel} disabled={!isExporting}>Cancel</button>
			<button class="btn" onclick={onclose} disabled={isExporting}>Close</button>
		</div>
	{/snippet}
</ModalDialog>
