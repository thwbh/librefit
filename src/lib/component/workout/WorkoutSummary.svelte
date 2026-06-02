<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import { Body, type ExtendedBodyPart, type Slug } from 'svelte-body-highlighter';
	import type { SessionSummary } from '$lib/workout/metrics';
	import type { WorkoutExerciseView } from '$lib/api';

	// Post-workout summary (WO-022), fullscreen. The body diagram highlights the
	// muscles worked this session (primary vs secondary involvement) as the hero;
	// total volume / active time / sets sit below. Dismiss reveals the dashboard
	// idle layout (DH-006). PR/comparison/share remain deferred.
	interface Props {
		summary: SessionSummary;
		/** Worked muscles in our seeded vocabulary (see the `muscle` lookup). */
		muscles?: { muscle: string; primary: boolean }[];
		/** Per-exercise breakdown for the at-a-glance recap. */
		exercises?: WorkoutExerciseView[];
		gender?: 'male' | 'female';
		ondismiss: () => void;
	}

	let { summary, muscles = [], exercises = [], gender = 'male', ondismiss }: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	// Rendered only while a summary exists, so open it on mount.
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const minutes = $derived(Math.floor(summary.activeWorkTimeMs / 60000));
	const seconds = $derived(Math.floor((summary.activeWorkTimeMs % 60000) / 1000));

	// `muscle` values are svelte-body-highlighter slugs (shared vocabulary), so
	// they map straight onto body parts — no translation table needed.
	const PRIMARY_COLOR = '#ea580c'; // accent orange — worked as a primary mover
	const SECONDARY_COLOR = '#fdba74'; // lighter — secondary involvement

	const bodyData = $derived.by<ExtendedBodyPart[]>(() => {
		const bySlug = new Map<Slug, boolean>();
		for (const m of muscles) {
			const slug = m.muscle as Slug;
			bySlug.set(slug, (bySlug.get(slug) ?? false) || m.primary);
		}
		return [...bySlug].map(([slug, primary]) => ({
			slug,
			color: primary ? PRIMARY_COLOR : SECONDARY_COLOR
		}));
	});
</script>

<div class="workout-modal">
	<ModalDialog bind:dialog oncancel={ondismiss}>
		{#snippet title()}
			<span class="modal-header border-l-4 border-accent pl-2">Workout complete</span>
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col items-center gap-6">
				{#if bodyData.length > 0}
					<div class="flex items-start justify-center gap-2">
						<Body {gender} data={bodyData} side="front" scale={0.85} />
						<Body {gender} data={bodyData} side="back" scale={0.85} />
					</div>
				{/if}

				<dl class="grid w-full max-w-md grid-cols-3 gap-4 text-center">
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

				{#if exercises.length > 0}
					<ul class="w-full max-w-md overflow-hidden rounded-box border border-base-200">
						{#each exercises as ex (ex.id)}
							<li class="flex flex-col gap-1 border-b border-base-200 p-3 last:border-b-0">
								<div class="flex items-center justify-between">
									<span class="font-semibold">{ex.name}</span>
									<span class="text-xs opacity-60">
										{ex.sets.length}
										{ex.sets.length === 1 ? 'set' : 'sets'}
									</span>
								</div>
								<div class="flex flex-wrap gap-1">
									{#each ex.sets as s (s.id)}
										<span class="badge badge-ghost badge-sm tabular-nums">
											{s.metrics.reps} × {s.metrics.weightKg} kg
										</span>
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-primary" onclick={ondismiss}>Done</button>
		{/snippet}
	</ModalDialog>
</div>

<style>
	/* Fullscreen completion screen, matching the workout overlay. */
	.workout-modal :global(.modal-box) {
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		border-radius: 0;
	}
	.workout-modal :global(.modal-box > :nth-child(1)) {
		flex: 0 0 auto;
	}
	.workout-modal :global(.modal-box > :nth-child(2)) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.workout-modal :global(.modal-box > :nth-child(3)) {
		flex: 0 0 auto;
	}
</style>
