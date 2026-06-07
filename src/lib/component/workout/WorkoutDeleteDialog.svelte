<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import type { WorkoutDetail } from '$lib/api';
	import { workoutSets, workoutStartTime, workoutTitle, workoutVolume } from '$lib/workout/history';
	import { Trash } from 'phosphor-svelte';

	// Delete confirmation for a logged workout — swipe-right entry point
	// (`_conv-gestures` GES-004, `_conv-modals` MOD-002): a read-only preview of
	// what will be removed, with explicit confirm/cancel.
	interface Props {
		detail: WorkoutDetail;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let { detail, onconfirm, oncancel }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const heading = $derived(workoutTitle(detail));
	const time = $derived(workoutStartTime(detail));
	const volume = $derived(workoutVolume(detail));
	const sets = $derived(workoutSets(detail));
</script>

<ModalDialog bind:dialog {oncancel}>
	{#snippet title()}
		<span class="border-l-4 border-error pl-2">Delete workout?</span>
	{/snippet}

	{#snippet content()}
		<div class="flex flex-col gap-3">
			<p class="text-sm opacity-70">This permanently removes the workout and all its sets.</p>
			<div class="rounded-box border border-base-200 p-3">
				<div class="font-semibold">{heading} · {time}</div>
				<div class="text-sm opacity-60 tabular-nums">
					{volume} kg · {sets}
					{sets === 1 ? 'set' : 'sets'}
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-error" onclick={onconfirm}>
			<Trash size="1.25rem" /> Delete
		</button>
		<button class="btn" onclick={oncancel}>Cancel</button>
	{/snippet}
</ModalDialog>
