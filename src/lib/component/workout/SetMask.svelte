<script lang="ts">
	import { NumberStepper } from '@thwbh/veilchen';
	import { validateLiftingSet } from '$lib/workout/metrics';
	import type { LiftingSetMetrics } from '$lib/api';

	// Reps + weight entry for logging or editing a set, using the same
	// NumberStepper the intake/weight masks use. Validation mirrors the backend
	// metric schema (`_conv-validation`); the server stays authoritative.
	interface Props {
		reps?: number;
		weightKg?: number;
		submitLabel?: string;
		onsubmit: (metrics: LiftingSetMetrics) => void | Promise<void>;
	}

	let { reps = 8, weightKg = 20, submitLabel = 'Log set', onsubmit }: Props = $props();

	let repsValue = $state(reps);
	let weightValue = $state(weightKg);
	let error = $state<string | null>(null);

	async function submit() {
		const metrics: LiftingSetMetrics = { reps: repsValue, weightKg: weightValue };
		const v = validateLiftingSet(metrics);
		if (v) {
			error = v;
			return;
		}
		error = null;
		await onsubmit(metrics);
	}
</script>

<div class="set-mask flex flex-col gap-2">
	<NumberStepper
		bind:value={repsValue}
		label="Reps"
		required
		min={1}
		max={1000}
		incrementSteps={[1, 5, 10]}
		decrementSteps={[1, 5, 10]}
		initialIncrementStep={1}
		initialDecrementStep={1}
		showLeftWheel={false}
	/>
	<NumberStepper
		bind:value={weightValue}
		label="Weight"
		unit="kg"
		required
		min={0}
		max={1000}
		incrementSteps={[0.5, 1, 2, 5, 10]}
		decrementSteps={[0.5, 1, 2, 5, 10]}
		initialIncrementStep={1}
		initialDecrementStep={1}
		showLeftWheel={false}
	/>
	{#if error}
		<p class="text-sm text-error" role="alert">{error}</p>
	{/if}
	<button class="btn btn-primary" onclick={submit}>{submitLabel}</button>
</div>
