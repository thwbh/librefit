<script lang="ts">
	import type { WorkoutDetail } from '$lib/api';
	import {
		workoutActiveMinutes,
		workoutSets,
		workoutStartTime,
		workoutTitle,
		workoutVolume,
		type WorkedMuscle
	} from '$lib/workout/history';
	import { Barbell } from 'phosphor-svelte';
	import { Body, type ExtendedBodyPart, type Slug } from 'svelte-body-highlighter';

	// A completed-workout summary card, shared by history, dashboard, and the
	// progress Workout segment. Shows start time, active work time, and total
	// volume. Its leading anchor is a small front muscle silhouette tinting the
	// muscles the session trained ([HI-017]); it falls back to a barbell icon when
	// no muscle data is supplied. Tapping opens the detail modal.
	interface Props {
		detail: WorkoutDetail;
		/** Worked muscles (seeded shortvalue = body-highlighter slug). Empty → icon. */
		muscles?: WorkedMuscle[];
		ontap?: (detail: WorkoutDetail) => void;
	}

	let { detail, muscles = [], ontap }: Props = $props();

	const title = $derived(workoutTitle(detail));
	const startTime = $derived(workoutStartTime(detail));
	const minutes = $derived(workoutActiveMinutes(detail));
	const volume = $derived(workoutVolume(detail));
	const sets = $derived(workoutSets(detail));

	// Tint primary movers in accent orange, secondary involvement lighter — same
	// palette as the post-workout summary. Slugs come straight from the seed.
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

<button
	type="button"
	class="w-full text-left bg-base-100 rounded-box shadow flex items-center gap-3 px-4 py-3"
	onclick={() => ontap?.(detail)}
>
	{#if bodyData.length > 0}
		<span class="shrink-0 grid h-10 w-10 place-items-center overflow-hidden" aria-hidden="true">
			<Body gender="male" data={bodyData} side="front" scale={0.16} border="none" />
		</span>
	{:else}
		<span class="bg-accent/10 text-accent rounded-full p-2 shrink-0">
			<Barbell size="1.5rem" />
		</span>
	{/if}
	<div class="flex flex-col min-w-0 flex-1">
		<span class="font-semibold truncate">{title}</span>
		<span class="text-xs opacity-60">{startTime}</span>
	</div>
	<dl class="flex gap-4 text-right tabular-nums shrink-0">
		<div>
			<dd class="font-semibold">{volume}</dd>
			<dt class="text-[0.65rem] opacity-60">kg vol</dt>
		</div>
		<div>
			<dd class="font-semibold">{minutes}m</dd>
			<dt class="text-[0.65rem] opacity-60">active</dt>
		</div>
		<div>
			<dd class="font-semibold">{sets}</dd>
			<dt class="text-[0.65rem] opacity-60">{sets === 1 ? 'set' : 'sets'}</dt>
		</div>
	</dl>
</button>
