<script lang="ts">
	import type { WorkoutDetail } from '$lib/api';
	import {
		workoutActiveMinutes,
		workoutSets,
		workoutStartTime,
		workoutTitle,
		workoutVolume
	} from '$lib/workout/history';
	import { Barbell, Pencil, Trash } from 'phosphor-svelte';
	import { SwipeableListItem } from '@thwbh/veilchen';
	import { longpress } from '$lib/gesture/long-press';

	// A completed-workout summary card, shared by history, dashboard, and the
	// progress Workout segment. Shows start time, active work time, and total
	// volume behind a barbell icon. Tapping opens the detail modal. When edit/delete
	// handlers are provided, the card mirrors the intake row gestures
	// (`_conv-gestures`): swipe-left / long-press → edit, swipe-right → delete.
	interface Props {
		detail: WorkoutDetail;
		ontap?: (detail: WorkoutDetail) => void;
		onedit?: (detail: WorkoutDetail) => void;
		ondelete?: (detail: WorkoutDetail) => void;
	}

	let { detail, ontap, onedit, ondelete }: Props = $props();

	const swipeable = $derived(!!onedit && !!ondelete);

	// SwipeableListItem suppresses the synthesized touch click but not a real mouse
	// click, so on desktop a swipe would fire both the edit/delete action and this
	// card's tap (opening the view modal behind it). Treat a click that lands far from
	// where the pointer went down as a drag, not a tap.
	let downX = 0;
	let downY = 0;
	function trackDown(e: PointerEvent) {
		downX = e.clientX;
		downY = e.clientY;
	}
	function handleTap(e: MouseEvent) {
		if (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8) return;
		ontap?.(detail);
	}

	const title = $derived(workoutTitle(detail));
	const startTime = $derived(workoutStartTime(detail));
	const minutes = $derived(workoutActiveMinutes(detail));
	const volume = $derived(workoutVolume(detail));
	const sets = $derived(workoutSets(detail));
</script>

{#snippet card()}
	<button
		type="button"
		class="w-full text-left bg-base-100 rounded-box shadow flex items-center gap-3 px-4 py-3"
		onpointerdown={trackDown}
		onclick={handleTap}
		use:longpress
		onlongpress={() => onedit?.(detail)}
	>
		<span class="bg-accent/10 text-accent rounded-full p-2 shrink-0">
			<Barbell size="1.5rem" />
		</span>
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
{/snippet}

{#if swipeable}
	<SwipeableListItem onleft={() => onedit?.(detail)} onright={() => ondelete?.(detail)}>
		{#snippet leftAction()}
			<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
		{/snippet}
		{#snippet rightAction()}
			<span><Trash size="1.75rem" color={'var(--color-error)'} /></span>
		{/snippet}
		{@render card()}
	</SwipeableListItem>
{:else}
	{@render card()}
{/if}
