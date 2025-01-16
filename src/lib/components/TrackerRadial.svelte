<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { CalorieTarget } from '$lib/model';

	interface Props {
		calorieTarget: CalorieTarget;
		entries: Array<number>;
	}

	let { calorieTarget, entries }: Props = $props();

	let limit = $state(calorieTarget && calorieTarget.targetCalories ? calorieTarget.targetCalories : 0),
		maximum = $state(calorieTarget && calorieTarget.maximumCalories ? calorieTarget.maximumCalories : 0),
		total = $state(0);

	let width = 512,
		height = 512;

	run(() => {
		if (entries && entries.length > 0) {
			total = entries.reduce((a, b) => a + b);
		}
	});

	run(() => {
		if (calorieTarget) {
			limit = calorieTarget.targetCalories;
			maximum = calorieTarget.maximumCalories;
		}
	});

	let innerEnd: number = $derived(calculateEnd(total, maximum)), outerEnd: number = $derived(calculateEnd(total, limit));

	const stroke = 40;

	const outerRadius = (width - stroke) / 2;
	const innerRadius = outerRadius - stroke;

	const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
		const angleInRadians = ((angleDeg - 90) * Math.PI) / 180.0;

		return {
			x: cx + radius * Math.cos(angleInRadians),
			y: cy + radius * Math.sin(angleInRadians)
		};
	};

	const arc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
		const start = polarToCartesian(cx, cy, radius, endAngle);
		const end = polarToCartesian(cx, cy, radius, startAngle);

		const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

		return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
	};

	const calculateEnd = (value: number, max: number) => {
		if (value >= max) {
			return 359;
		} else {
			return (359 * value) / max;
		}
	};

	let strokeClass =
		$derived(total <= limit
			? 'stroke-primary-500'
			: total > limit && total <= maximum
				? 'stroke-overflow-1'
				: 'stroke-overflow-2');

	
	

	run(() => {
		calculateEnd;
	});
</script>

<figure class="progress-radial relative overflow-hidden w-64" data-testid="progress-radial">
	<svg viewBox="0 0 {width} {height}" class="rounded-full">
		<g stroke-width={stroke}>
			<path
				d={arc(width / 2, height / 2, outerRadius, 0, 359)}
				class="progress-radial-track fill-transparent stroke-primary-500/30"
				stroke-linecap="round"
			/>

			{#if calorieTarget}
				<path
					d={arc(width / 2, height / 2, outerRadius, 0, outerEnd)}
					class="progress-radial-track fill-transparent {strokeClass}"
				/>

				{#if total > 0}
					<path
						d={arc(width / 2, height / 2, outerRadius, outerEnd, outerEnd)}
						class="progress-radial-track fill-transparent {strokeClass}"
						stroke-linecap="round"
					/>
				{/if}
			{/if}
		</g>

		<g stroke-width={stroke}>
			<path
				d={arc(width / 2, height / 2, innerRadius, 0, 359)}
				class="progress-radial-track fill-transparent stroke-secondary-500/30"
				stroke-linecap="round"
			/>

			{#if calorieTarget}
				<path
					d={arc(width / 2, height / 2, innerRadius, 0, innerEnd)}
					class="progress-radial-track fill-transparent stroke-secondary-500"
				/>

				{#if total > 0}
					<path
						d={arc(width / 2, height / 2, innerRadius, innerEnd, innerEnd)}
						class="progress-radial-track fill-transparent stroke-secondary-500"
						stroke-linecap="round"
					/>
				{/if}
			{/if}
		</g>
		<text
			x={width / 2}
			y={height / 2}
			text-anchor="middle"
			dominant-baseline="middle"
			font-weight="bold"
			font-size="56"
			class="progress-radial-text fill-token"
		>
			{total}
			{#if calorieTarget}
				/ {limit}
			{/if}
		</text>

		{#if calorieTarget}
			<text
				x={width / 2}
				y={height / 2 + 60}
				text-anchor="middle"
				dominant-baseline="middle"
				font-weight="bold"
				font-size="34"
				class="progress-radial-text fill-token"
			>
				{total} / {maximum}
			</text>
		{/if}
	</svg>
</figure>

<style>
	.stroke-overflow-1 {
		stroke: rgb(var(--color-warning-500) / 1);
	}

	.stroke-overflow-2 {
		stroke: rgb(var(--color-error-500) / 1);
	}
</style>
