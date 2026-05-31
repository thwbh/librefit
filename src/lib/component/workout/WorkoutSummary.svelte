<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import type { SessionSummary } from '$lib/workout/metrics';

	// Post-workout summary (WO-022) via veilchen's ModalDialog: total volume,
	// active work time, sets. PR/comparison/share are deferred. Dismiss reveals
	// the dashboard idle layout (DH-006).
	interface Props {
		summary: SessionSummary;
		ondismiss: () => void;
	}

	let { summary, ondismiss }: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	// Rendered only while a summary exists, so open it on mount.
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const minutes = $derived(Math.floor(summary.activeWorkTimeMs / 60000));
	const seconds = $derived(Math.floor((summary.activeWorkTimeMs % 60000) / 1000));
</script>

<ModalDialog bind:dialog oncancel={ondismiss}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">Workout complete</span>
	{/snippet}

	{#snippet content()}
		<dl class="grid grid-cols-3 gap-4 text-center">
			<div>
				<dt class="text-xs opacity-70">Volume</dt>
				<dd class="text-2xl font-bold tabular-nums">{summary.totalVolume} kg</dd>
			</div>
			<div>
				<dt class="text-xs opacity-70">Time</dt>
				<dd class="text-2xl font-bold tabular-nums">
					{minutes}:{seconds.toString().padStart(2, '0')}
				</dd>
			</div>
			<div>
				<dt class="text-xs opacity-70">Sets</dt>
				<dd class="text-2xl font-bold tabular-nums">{summary.setsCompleted}</dd>
			</div>
		</dl>
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-primary" onclick={ondismiss}>Done</button>
	{/snippet}
</ModalDialog>
