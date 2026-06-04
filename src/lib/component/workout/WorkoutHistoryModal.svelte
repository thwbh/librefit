<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import { Body, type ExtendedBodyPart, type Slug } from 'svelte-body-highlighter';
	import type { WorkoutDetail } from '$lib/api';
	import {
		workoutActiveMinutes,
		workoutSets,
		workoutStartTime,
		workoutTitle,
		workoutVolume,
		type WorkedMuscle
	} from '$lib/workout/history';

	// Read-only detail of a completed workout ([HI-019]): the worked-muscle map, the
	// summary numbers, and all exercises/sets/metrics. Fullscreen to match the
	// post-workout summary. View only — edit/delete are card-swipe gestures
	// (`_conv-gestures`), not buttons here.
	interface Props {
		detail: WorkoutDetail;
		/** Worked muscles (seeded shortvalue = body-highlighter slug) for the map. */
		muscles?: WorkedMuscle[];
		gender?: 'male' | 'female';
		onclose: () => void;
	}

	let { detail, muscles = [], gender = 'male', onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const heading = $derived(workoutTitle(detail));
	const startTime = $derived(workoutStartTime(detail));
	const minutes = $derived(workoutActiveMinutes(detail));
	const volume = $derived(workoutVolume(detail));
	const sets = $derived(workoutSets(detail));

	// Same palette as the post-workout summary: primary movers accent orange,
	// secondary involvement lighter.
	const PRIMARY_COLOR = '#ea580c';
	const SECONDARY_COLOR = '#fdba74';
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
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="border-l-4 border-accent pl-2">{heading} · {startTime}</span>
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
						<dd class="text-2xl font-bold tabular-nums">{volume} kg</dd>
					</div>
					<div>
						<dt class="text-xs opacity-70">Active</dt>
						<dd class="text-2xl font-bold tabular-nums">{minutes}m</dd>
					</div>
					<div>
						<dt class="text-xs opacity-70">Sets</dt>
						<dd class="text-2xl font-bold tabular-nums">{sets}</dd>
					</div>
				</dl>

				{#if detail.exercises.length > 0}
					<ul class="w-full max-w-md overflow-hidden rounded-box border border-base-200">
						{#each detail.exercises as ex (ex.id)}
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
				{:else}
					<p class="text-center text-sm opacity-60">No exercises logged.</p>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-primary" onclick={onclose}>Close</button>
		{/snippet}
	</ModalDialog>
</div>

<style>
	/* Fullscreen detail, matching the post-workout summary / workout overlay. */
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
