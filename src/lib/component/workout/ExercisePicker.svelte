<script lang="ts">
	import { onMount } from 'svelte';
	import { getExerciseLibrary, type ExerciseDetail } from '$lib/api';

	// Lists the seeded exercise library with category and muscles (WO-012, WO-013).
	interface Props {
		onpick: (exercise: ExerciseDetail) => void | Promise<void>;
	}

	let { onpick }: Props = $props();

	let entries = $state<ExerciseDetail[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			entries = await getExerciseLibrary();
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	});

	function muscles(entry: ExerciseDetail): string {
		return entry.muscles.map((m) => `${m.muscle} (${m.role})`).join(', ');
	}
</script>

<div class="exercise-picker flex flex-col gap-2">
	{#if loading}
		<span class="loading loading-spinner"></span>
	{:else if error}
		<p class="text-error" role="alert">{error}</p>
	{:else}
		<ul class="flex flex-col gap-1">
			{#each entries as entry (entry.id)}
				<li>
					<button class="btn btn-block btn-ghost justify-start" onclick={() => onpick(entry)}>
						<span class="font-medium">{entry.name}</span>
						<span class="text-xs opacity-70">{entry.category} · {muscles(entry)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
