<script lang="ts">
	// Slide-to-confirm gesture per `_conv-gestures`: the action fires only when
	// the thumb is dragged past the confirmation threshold. A tap or partial
	// slide does nothing (snaps back). Threshold-crossing emits a haptic pulse.
	interface Props {
		label?: string;
		/** Pixels of travel required to confirm. */
		distance?: number;
		onconfirm: () => void;
		variant?: 'neutral' | 'danger';
	}

	let {
		label = 'Slide to confirm',
		distance = 200,
		onconfirm,
		variant = 'neutral'
	}: Props = $props();

	let startX = $state<number | null>(null);
	let delta = $state(0);
	let armed = $state(false);

	const progress = $derived(Math.max(0, Math.min(1, delta / distance)));
	const past = $derived(progress >= 1);

	function haptic() {
		if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
			navigator.vibrate(20);
		}
	}

	function onpointerdown(e: PointerEvent) {
		startX = e.clientX;
		delta = 0;
		armed = false;
		(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
	}

	function onpointermove(e: PointerEvent) {
		if (startX === null) return;
		delta = Math.max(0, e.clientX - startX);
		if (past && !armed) {
			armed = true;
			haptic(); // fire the threshold pulse exactly once per crossing
		} else if (!past && armed) {
			armed = false;
		}
	}

	function onpointerup() {
		if (startX === null) return;
		const confirmed = past;
		startX = null;
		delta = 0;
		armed = false;
		if (confirmed) onconfirm();
	}
</script>

<div
	class="slide-to-confirm relative h-12 w-full touch-none select-none overflow-hidden rounded-full {variant ===
	'danger'
		? 'bg-error/20'
		: 'bg-base-300'}"
	role="button"
	tabindex="0"
	aria-label={label}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={onpointerup}
>
	<div
		class="absolute inset-y-0 left-0 {variant === 'danger' ? 'bg-error/40' : 'bg-primary/30'}"
		style="width: {progress * 100}%"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium"
	>
		{label}
	</div>
	<div
		class="absolute inset-y-1 left-1 aspect-square rounded-full {variant === 'danger'
			? 'bg-error'
			: 'bg-primary'}"
		style="transform: translateX({progress * Math.max(0, distance - 8)}px)"
		aria-hidden="true"
	></div>
</div>
