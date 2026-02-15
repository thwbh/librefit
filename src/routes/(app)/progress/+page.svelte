<script lang="ts">
	import { LineChart } from '@thwbh/veilchen';
	import NumberFlow from '@number-flow/svelte';
	import { TrendDown, TrendUp, ChartBar } from 'phosphor-svelte';
	import { getFoodCategoryIcon, getFoodCategoryLongvalue } from '$lib/api/category';
	import { getCategoriesContext } from '$lib/context/categories.svelte.js';

	let { data } = $props();

	const foodCategories = getCategoriesContext();

	const progress = data.trackerProgress;

	const { weightTarget, intakeTarget, daysPassed, daysTotal } = progress;
	const wcd = progress.weightChartData;
	const icd = progress.intakeChartData;

	// Progress
	const progressPercent =
		daysTotal === 0 ? 0 : Math.min(100, Math.round((daysPassed / daysTotal) * 100));

	// Weight
	const initialWeight = weightTarget.initialWeight;
	const targetWeight = weightTarget.targetWeight;
	const currentWeight = wcd.values.length > 0 ? wcd.values[wcd.values.length - 1] : initialWeight;
	const weightDiff = currentWeight - initialWeight;
	const isGaining = targetWeight > initialWeight;
	const rateLabel = isGaining ? 'surplus' : 'deficit';

	// Intake
	const deficit = intakeTarget.maximumCalories - icd.dailyAverage;
	const targetDeficit = intakeTarget.maximumCalories - intakeTarget.targetCalories;

	const categories = Object.entries(icd.categoryAverage)
		.filter(([_, avg]) => avg > 0)
		.sort(([, a], [, b]) => b - a);

	const maxCategoryAvg = categories.length > 0 ? categories[0][1] : 1;

	// Theme colors for Chart.js (needs computed RGB, not oklch)
	const getThemeColor = (colorVar: string): string => {
		if (typeof window === 'undefined') return 'rgb(0, 0, 0)';
		const temp = document.createElement('div');
		temp.style.color = `var(${colorVar})`;
		document.body.appendChild(temp);
		const computedColor = getComputedStyle(temp).color;
		document.body.removeChild(temp);
		return computedColor || 'rgb(0, 0, 0)';
	};

	const withAlpha = (color: string, alpha: number): string => {
		const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (match) return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
		return color;
	};

	const primaryColor = getThemeColor('--color-primary');
	const accentColor = getThemeColor('--color-accent');

	const xAxisConfig = {
		grid: { display: false },
		ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
	};

	const weightChartConfig = {
		data: {
			labels: wcd.legend,
			datasets: [
				{
					label: 'Weight',
					data: wcd.values,
					borderColor: primaryColor,
					backgroundColor: withAlpha(primaryColor, 0.08),
					tension: 0.4,
					fill: true,
					borderWidth: 2,
					order: 1
				},
				{
					label: 'Target',
					data: wcd.legend.map(() => targetWeight),
					borderColor: accentColor,
					borderDash: [6, 4],
					pointRadius: 0,
					borderWidth: 1.5,
					fill: false,
					order: 0
				}
			]
		},
		options: {
			responsive: true,
			elements: { point: { radius: 0 } },
			plugins: { legend: { display: false } },
			scales: {
				x: xAxisConfig,
				y: {
					suggestedMin: Math.min(wcd.min, targetWeight) - 1,
					suggestedMax: Math.max(wcd.max, targetWeight) + 1,
					grid: { color: 'rgba(0,0,0,0.05)' },
					ticks: { font: { size: 11 } }
				}
			}
		}
	};

	const intakeChartConfig = {
		data: {
			labels: icd.legend,
			datasets: [
				{
					label: 'Intake',
					data: icd.values,
					borderColor: primaryColor,
					backgroundColor: withAlpha(primaryColor, 0.08),
					tension: 0.4,
					fill: true,
					borderWidth: 2,
					order: 1
				},
				{
					label: 'Target',
					data: icd.legend.map(() => intakeTarget.targetCalories),
					borderColor: accentColor,
					borderDash: [6, 4],
					pointRadius: 0,
					borderWidth: 1.5,
					fill: false,
					order: 0
				}
			]
		},
		options: {
			responsive: true,
			elements: { point: { radius: 0 } },
			plugins: { legend: { display: false } },
			scales: {
				x: xAxisConfig,
				y: {
					suggestedMin: icd.min - 100,
					suggestedMax: Math.max(icd.max, intakeTarget.maximumCalories) + 100,
					grid: { color: 'rgba(0,0,0,0.05)' },
					ticks: { font: { size: 11 } }
				}
			}
		}
	};
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Progress</h1>

	<!-- Header -->
	<div class="bg-primary text-primary-content px-6 pt-8 pb-14">
		<div class="flex flex-col gap-1">
			<span class="text-3xl font-bold">Your Progress</span>
			<span class="text-sm opacity-70">Day {daysPassed + 1} of {daysTotal + 1}</span>
		</div>

		<!-- Progress bar -->
		<div class="mt-6">
			<div class="journey-bar-track">
				<div class="journey-bar-fill" style="width: calc({progressPercent}% + 0.5rem)"></div>
			</div>
		</div>

		<!-- Weight summary -->
		<div class="flex justify-between items-end mt-4">
			<div class="flex flex-col">
				<span class="text-2xl font-bold">
					<NumberFlow value={initialWeight} /> <span class="text-xs">kg</span>
				</span>
				<span class="text-xs opacity-70">Start</span>
			</div>

			<div class="flex items-center gap-1 opacity-80">
				{#if weightDiff === 0}
					<span class="text-sm">No change</span>
				{:else}
					{#if weightDiff > 0}
						<TrendUp size="1rem" weight="bold" />
					{:else}
						<TrendDown size="1rem" weight="bold" />
					{/if}
					<span class="text-sm font-semibold">{Math.abs(weightDiff).toFixed(1)} kg</span>
				{/if}
			</div>

			<div class="flex flex-col items-end">
				<span class="text-2xl font-bold">
					<NumberFlow value={currentWeight} /> <span class="text-xs">kg</span>
				</span>
				<span class="text-xs opacity-70">Current</span>
			</div>
		</div>
	</div>

	<!-- Content -->
	{#if daysPassed < 2}
		<div
			class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col items-center justify-center gap-4 p-8 pt-16"
		>
			<ChartBar size="3rem" weight="duotone" class="opacity-30" />
			<p class="text-lg font-semibold text-base-content">Not enough data yet</p>
			<p class="text-sm opacity-60 text-center">
				Track for at least 2 days to see your progress charts.
			</p>
		</div>
	{:else}
		<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col gap-4 p-4 pt-6">
			<!-- Weight chart card -->
			<div class="bg-base-100 rounded-box p-4 shadow">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-lg font-semibold">Weight</h2>
					<div class="flex items-center gap-3 text-xs opacity-60">
						<span class="flex items-center gap-1">
							<span class="inline-block w-4 h-0.5 bg-primary rounded"></span> Actual
						</span>
						<span class="flex items-center gap-1">
							<span class="inline-block w-4 border-t border-dashed border-accent"></span>
							Target
						</span>
					</div>
				</div>
				<LineChart data={weightChartConfig.data} options={weightChartConfig.options} />
			</div>

			<!-- Intake chart card -->
			<div class="bg-base-100 rounded-box p-4 shadow">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-lg font-semibold">Calorie Intake</h2>
					<div class="flex items-center gap-3 text-xs opacity-60">
						<span class="flex items-center gap-1">
							<span class="inline-block w-4 h-0.5 bg-primary rounded"></span> Actual
						</span>
						<span class="flex items-center gap-1">
							<span class="inline-block w-4 border-t border-dashed border-accent"></span>
							Target
						</span>
					</div>
				</div>
				<LineChart data={intakeChartConfig.data} options={intakeChartConfig.options} />

				<div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-base-200">
					<div>
						<span class="text-xs opacity-70">Average per day</span>
						<div class="text-2xl font-bold text-primary">
							<NumberFlow value={icd.avg} />
							<span class="text-sm font-normal">kcal</span>
						</div>
						<span class="text-xs opacity-50">Target: {intakeTarget.targetCalories} kcal</span>
					</div>
					<div class="text-right">
						<span class="text-xs opacity-70">Average {rateLabel}</span>
						<div class="text-2xl font-bold text-accent">
							<NumberFlow value={Math.abs(deficit)} />
							<span class="text-sm font-normal">kcal</span>
						</div>
						<span class="text-xs opacity-50">Target: {targetDeficit}</span>
					</div>
				</div>
			</div>

			<!-- Category breakdown -->
			{#if categories.length > 0}
				<div class="bg-base-100 rounded-box p-4 shadow">
					<h2 class="text-lg font-semibold mb-3">By Category</h2>
					<div class="flex flex-col gap-3">
						{#each categories as [code, avg] (code)}
							{@const Icon = getFoodCategoryIcon(code)}
							{@const percent = Math.round((avg / maxCategoryAvg) * 100)}
							<div class="flex items-center gap-3">
								<div class="w-8 flex justify-center opacity-60">
									{#if Icon}
										<Icon size="1.25rem" />
									{/if}
								</div>
								<div class="flex-1">
									<div class="flex justify-between mb-1">
										<span class="text-sm"
											>{getFoodCategoryLongvalue(foodCategories, code) ?? code}</span
										>
										<span class="text-sm font-semibold">{Math.round(avg)} kcal</span>
									</div>
									<div class="h-2 bg-primary/10 rounded-full">
										<div
											class="h-full bg-primary rounded-full transition-all duration-500"
											style="width: {percent}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.journey-bar-track {
		height: 0.25rem;
		border-radius: 9999px;
		background-color: oklch(0.85 0.02 280);
		overflow: visible;
		position: relative;
	}

	.journey-bar-fill {
		height: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background-color: var(--color-accent);
		position: relative;
		min-width: 1rem;
		transition: width 0.6s ease;
		clip-path: polygon(0% 0%, calc(100% - 0.5rem) 0%, 100% 50%, calc(100% - 0.5rem) 100%, 0% 100%);
	}
</style>
