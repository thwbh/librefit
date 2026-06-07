<script lang="ts">
	import { Body, type ExtendedBodyPart, type Slug } from 'svelte-body-highlighter';
	import type { WorkedMuscle } from '$lib/workout/history';

	// Front+back muscle coverage map for the progress Workout segment ([PG-010]).
	// Each muscle is tinted by the strongest role it was trained with over the range —
	// primary (accent) vs secondary (lighter); untrained muscles keep the base body
	// colour. Tapping a muscle group names it and its role ([PG-011]).
	interface Props {
		/** Aggregated coverage: seeded shortvalue (= body-highlighter slug) + primary flag. */
		muscles: WorkedMuscle[];
		gender?: 'male' | 'female';
	}

	let { muscles, gender = 'male' }: Props = $props();

	const PRIMARY_COLOR = '#ea580c';
	const SECONDARY_COLOR = '#fdba74';

	const roleBySlug = $derived(
		new Map(muscles.map((m) => [m.muscle, m.primary ? 'primary' : 'secondary'] as const))
	);
	const bodyData = $derived(
		muscles.map<ExtendedBodyPart>((m) => ({
			slug: m.muscle as Slug,
			color: m.primary ? PRIMARY_COLOR : SECONDARY_COLOR
		}))
	);

	let selected = $state<{ name: string; role: string } | null>(null);

	const pretty = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	function onPress(part: ExtendedBodyPart) {
		const slug = part.slug as string;
		selected = { name: pretty(slug), role: roleBySlug.get(slug) ?? 'not targeted' };
	}
</script>

<div class="flex flex-col items-center gap-3">
	<div class="flex items-start justify-center gap-2">
		<Body {gender} data={bodyData} side="front" scale={0.6} onBodyPartPress={onPress} />
		<Body {gender} data={bodyData} side="back" scale={0.6} onBodyPartPress={onPress} />
	</div>

	<p class="text-sm" aria-live="polite">
		{#if selected}
			<span class="font-semibold">{selected.name}</span>
			<span class="opacity-70">· {selected.role}</span>
		{:else}
			<span class="opacity-60">Tap a muscle group for detail</span>
		{/if}
	</p>

	<div class="flex gap-4 text-xs opacity-70">
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded-full" style="background:{PRIMARY_COLOR}"></span>
			Primary
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded-full" style="background:{SECONDARY_COLOR}"></span>
			Secondary
		</span>
	</div>
</div>
