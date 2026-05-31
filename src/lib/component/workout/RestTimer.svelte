<script lang="ts">
	// Rest countdown. The remaining time is derived upstream from the last set's
	// `loggedAt` against the exercise's rest target; this component only renders
	// it and offers a dismiss. It ends on expiry (remainingMs hits 0), dismiss,
	// or the next set log (which resets remainingMs upstream).
	interface Props {
		remainingMs: number;
		ondismiss: () => void;
	}

	let { remainingMs, ondismiss }: Props = $props();

	const seconds = $derived(Math.ceil(remainingMs / 1000));
	const mm = $derived(Math.floor(seconds / 60));
	const ss = $derived(seconds % 60);
</script>

{#if remainingMs > 0}
	<div class="rest-timer flex items-center justify-between rounded-box bg-info/20 p-3" role="timer">
		<span class="text-sm font-medium">Rest</span>
		<span class="font-mono text-lg tabular-nums">{mm}:{ss.toString().padStart(2, '0')}</span>
		<button class="btn btn-ghost btn-sm" onclick={ondismiss}>Skip</button>
	</div>
{/if}
