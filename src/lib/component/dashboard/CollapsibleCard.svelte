<script lang="ts">
	import type { Snippet } from 'svelte';

	// A dashboard card that collapses to a micro-progress-bar row while a workout
	// is active (DH-003) and expands back to its full card in place when tapped
	// (DH-004). When not collapsed (idle dashboard) it always shows the full card.
	interface Props {
		label: string;
		/** Progress fraction 0..1 shown as the micro bar fill. */
		value: number;
		/** True while the dashboard is in the active-workout state. */
		collapsed: boolean;
		children: Snippet;
	}

	let { label, value, collapsed, children }: Props = $props();

	let expanded = $state(false);

	const pct = $derived(Math.round(Math.max(0, Math.min(1, value)) * 100));
</script>

{#if !collapsed || expanded}
	<div class="collapsible-card">
		{@render children()}
		{#if collapsed}
			<button class="btn btn-ghost btn-xs mt-1" onclick={() => (expanded = false)}>Collapse</button>
		{/if}
	</div>
{:else}
	<button
		class="micro-row flex w-full items-center gap-2 rounded-box bg-base-200 p-2 text-left"
		aria-label={`Expand ${label}`}
		onclick={() => (expanded = true)}
	>
		<span class="w-16 shrink-0 text-xs font-medium">{label}</span>
		<progress class="progress progress-primary grow" value={pct} max="100" aria-label={label}
			>{pct}%</progress
		>
	</button>
{/if}
