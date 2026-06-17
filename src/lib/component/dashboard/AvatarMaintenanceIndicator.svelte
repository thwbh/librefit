<script lang="ts">
	import { Avatar } from '@thwbh/veilchen';
	import type { UnverifiedSummary } from '$lib/api';
	import { parseStringAsDateTime } from '$lib/date';
	import { differenceInHours } from 'date-fns';

	// Maintenance indicator hosted on the dashboard avatar (DH-019..DH-022). Surfaces
	// the count of unverified exercises (owned by `workout-tracking`) and applies
	// graceful decay: prominent while the unverified exercises are recent, muted once
	// they age past the recency window, so it informs without nagging. Clears entirely
	// when nothing is unverified. Tapping it opens the batch-tagging quick-fix.
	interface Props {
		avatarSrc: string;
		summary: UnverifiedSummary | null;
		/** Opens the batch-tagging quick-fix workspace (DH-022). */
		onopen: () => void;
	}

	let { avatarSrc, summary, onopen }: Props = $props();

	// Recency window for graceful decay (design open question): one step at 48h.
	const DECAY_HOURS = 48;

	const count = $derived(summary?.count ?? 0);
	const decayed = $derived.by(() => {
		if (!summary || !summary.oldestAdded || !summary.oldestTime) return false;

		const dateTimeAdded = parseStringAsDateTime(summary.oldestAdded!, summary.oldestTime!);

		return differenceInHours(Date.now(), dateTimeAdded) > DECAY_HOURS;
	});
	const label = $derived(`${count} exercise${count === 1 ? '' : 's'} to tidy up`);
</script>

{#if count > 0}
	<button
		type="button"
		class="relative inline-flex"
		onclick={onopen}
		aria-label={label}
		data-testid="maintenance-indicator"
		data-decayed={decayed}
	>
		<Avatar size="lg" src={avatarSrc} />
		<span
			class="badge badge-sm absolute -right-1 -top-1 border-2 border-primary tabular-nums {decayed
				? 'badge-neutral opacity-60'
				: 'badge-error animate-pulse'}"
			data-testid="maintenance-count"
		>
			{count}
		</span>
	</button>
{:else if avatarSrc}
	<Avatar size="lg" src={avatarSrc} />
{/if}
