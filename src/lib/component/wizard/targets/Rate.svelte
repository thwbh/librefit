<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import {
		AlertBox,
		AlertType,
		OptionCards,
		RangeInput,
		StatCard,
		type OptionCardData
	} from '@thwbh/veilchen';

	interface Props {
		value: number;
		rates: Array<number>;
		targetDates: Record<number, string>;
		targetProgress: Record<number, number>;
	}

	let { value = $bindable(), rates, targetDates, targetProgress }: Props = $props();

	const difficultyConfig: Record<
		number,
		{ badge: { text: string; color: 'success' | 'info' | 'warning' | 'error' } }
	> = {
		100: { badge: { text: 'Very Easy', color: 'success' } },
		200: { badge: { text: 'Easy', color: 'success' } },
		300: { badge: { text: 'Moderate', color: 'info' } },
		400: { badge: { text: 'Moderate', color: 'info' } },
		500: { badge: { text: 'Challenging', color: 'warning' } },
		600: { badge: { text: 'Hard', color: 'warning' } },
		700: { badge: { text: 'Very Hard', color: 'error' } }
	};

	const data: Array<OptionCardData> = $derived.by(() => {
		const rate = value;
		const isRecommended = rate === 500;

		return [
			{
				value: rate,
				header: `${rate} kcal/day`,
				badge: difficultyConfig[rate].badge,
				highlight: isRecommended ? { text: 'Recommended', color: 'primary' } : undefined,
				metrics: [
					{
						label: 'Weekly Loss',
						value: `${targetProgress[rate]} kg/week`
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

<div class="flex flex-col gap-4">
	<RangeInput bind:value step={100} min={100} max={700} unit="kcal" label="Deficit" />

	<OptionCards bind:value {data} maxHeight="50vh" />

	<AlertBox type={AlertType.Info}>
		<strong>Find your sweet spot.</strong>
		<p class="text-sm">
			A higher deficit means faster weight loss, but is also harder to maintain. Many people
			consider a value around 500 kcal as the sweet spot.
		</p>
	</AlertBox>
</div>
