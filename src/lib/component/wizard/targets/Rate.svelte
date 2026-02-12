<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import {
		AlertBox,
		AlertType,
		AlertVariant,
		OptionCards,
		RangeInput,
		BadgeColor,
		type OptionCardData,
		type OptionCardBadge
	} from '@thwbh/veilchen';
	import { getWizardContext } from '$lib/context';
	import TargetWeight from './TargetWeight.svelte';

	interface Props {
		value: number;
		rates?: Array<number>;
		targetDates?: Record<number, string>;
		targetProgress?: Record<number, number>;
		targetWeight?: number;
	}

	let {
		value = $bindable(),
		rates,
		targetDates,
		targetProgress,
		targetWeight = $bindable(0)
	}: Props = $props();

	// Get recommendation from wizard context to determine if we're gaining, losing, or maintaining
	const wizardState = getWizardContext();
	const recommendation = wizardState.wizardResult?.recommendation || 'LOSE';

	const isGaining = recommendation === 'GAIN';
	const isHolding = recommendation === 'HOLD';
	const isLosing = recommendation === 'LOSE';

	// For GAIN users, check if they're in low-normal BMI range (18.5-19.9)
	// These users should select target weight instead of calorie rate
	const isLowNormalBmi = $derived(
		wizardState.wizardResult &&
			wizardState.wizardResult.bmi >= 18.5 &&
			wizardState.wizardResult.bmi < 20 &&
			recommendation === 'GAIN'
	);

	// Show weight target selector for HOLD or low-normal GAIN users
	const showWeightSelector = $derived(isHolding || isLowNormalBmi);

	// Dynamic labels based on goal
	const progressLabel = isGaining ? 'Weekly Gain' : isHolding ? 'Weekly Change' : 'Weekly Loss';
	const rateLabel = isGaining ? 'Surplus' : isHolding ? 'Adjustment' : 'Deficit';
	const actionWord = isGaining ? 'weight gain' : isHolding ? 'maintenance' : 'weight loss';

	const difficultyConfig: Record<
		number,
		{
			badge: OptionCardBadge;
		}
	> = {
		100: { badge: { text: 'Very Easy', color: BadgeColor.Primary } },
		200: { badge: { text: 'Easy', color: BadgeColor.Secondary } },
		300: { badge: { text: 'Moderate', color: BadgeColor.Info } },
		400: { badge: { text: 'Moderate', color: BadgeColor.Info } },
		500: { badge: { text: 'Challenging', color: BadgeColor.Warning } },
		600: { badge: { text: 'Hard', color: BadgeColor.Warning } },
		700: { badge: { text: 'Very Hard', color: BadgeColor.Accent } }
	};

	const data: Array<OptionCardData> = $derived.by(() => {
		if (!targetProgress || !targetDates) return [];

		const rate = value;
		const isRecommended = rate === 500;

		return [
			{
				value: rate,
				header: `${rate} kcal/day`,
				badge: difficultyConfig[rate].badge,
				highlight: isRecommended ? { text: 'Recommended', color: BadgeColor.Primary } : undefined,
				metrics: [
					{
						label: progressLabel,
						value: `${Math.abs(targetProgress[rate])} kg/week`
					},
					{
						label: 'Target Date',
						value: convertDateStrToDisplayDateStr(targetDates[rate]!).split(',')[0]
					}
				]
			}
		];
	});
</script>

{#if showWeightSelector && wizardState.wizardResult}
	<!-- For HOLD or low-normal GAIN users, show weight target selector -->
	<TargetWeight
		bind:value={targetWeight}
		targetWeightLower={isLowNormalBmi
			? wizardState.wizardInput.weight
			: wizardState.wizardResult.targetWeightLower}
		targetWeightUpper={wizardState.wizardResult.targetWeightUpper}
	/>

	{#if isLowNormalBmi && Math.abs(targetWeight - wizardState.wizardInput.weight) > 0.1 && rates && targetDates && targetProgress}
		<!-- For low-normal GAIN users who chose to gain weight, also show pace selector -->
		<div class="divider">Choose Your Pace</div>

		<div class="flex flex-col gap-4">
			<RangeInput bind:value step={100} min={100} max={700} unit="kcal" label={rateLabel} />

			<OptionCards bind:value {data} maxHeight="50vh" />

			<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
				<strong>Find your sweet spot.</strong>
				<p class="text-sm">
					A higher surplus means faster weight gain, but requires eating significantly more. Many
					people consider a value around 500 kcal as the sweet spot.
				</p>
			</AlertBox>
		</div>
	{/if}
{:else if rates && targetDates && targetProgress}
	<!-- For LOSE or normal GAIN recommendations, show rate selector -->
	<div class="flex flex-col gap-4">
		<RangeInput bind:value step={100} min={100} max={700} unit="kcal" label={rateLabel} />

		<OptionCards bind:value {data} maxHeight="50vh" />

		<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
			<strong>Find your sweet spot.</strong>
			<p class="text-sm">
				{#if isGaining}
					A higher surplus means faster weight gain, but requires eating significantly more. Many
					people consider a value around 500 kcal as the sweet spot.
				{:else}
					A higher deficit means faster weight loss, but is also harder to maintain. Many people
					consider a value around 500 kcal as the sweet spot.
				{/if}
			</p>
		</AlertBox>
	</div>
{/if}
