<script lang="ts">
	import { onMount } from 'svelte';
	import { ModalDialog } from '@thwbh/veilchen';
	import { Barbell, ClipboardText } from 'phosphor-svelte';
	import { listWorkoutTemplates, type TemplateDetail } from '$lib/api';

	// Start Workout chooser (WO-040): begin an empty session or start prefilled from a
	// template. Shown when the dashboard Start Workout module is tapped while idle.
	interface Props {
		onempty: () => void;
		ontemplate: (id: number) => void;
		onclose: () => void;
	}

	let { onempty, ontemplate, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	let templates = $state<TemplateDetail[]>([]);
	onMount(async () => {
		try {
			templates = await listWorkoutTemplates();
		} catch {
			// Non-blocking — the empty-start path stays available.
		}
	});

	const summary = (t: TemplateDetail) =>
		`${t.exercises.length} exercise${t.exercises.length === 1 ? '' : 's'}`;
</script>

<div class="start-workout-sheet">
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="border-l-4 border-accent pl-2">Start workout</span>
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col gap-3">
				<button
					class="btn btn-primary btn-block justify-start gap-2"
					onclick={onempty}
					data-testid="start-empty"
				>
					<Barbell size="1.25rem" /> Empty workout
				</button>

				{#if templates.length > 0}
					<span class="text-xs font-medium uppercase tracking-wide opacity-50">From a template</span
					>
					<ul class="flex flex-col gap-1" data-testid="start-template-list">
						{#each templates as t (t.template.id)}
							<li>
								<button
									class="btn btn-ghost btn-block h-auto justify-start gap-3 py-2"
									onclick={() => ontemplate(t.template.id)}
									data-testid="start-template"
								>
									<ClipboardText size="1.25rem" class="opacity-70" />
									<span class="flex flex-col items-start">
										<span class="font-medium">{t.template.name}</span>
										<span class="text-xs opacity-60">{summary(t)}</span>
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" onclick={onclose}>Cancel</button>
		{/snippet}
	</ModalDialog>
</div>
