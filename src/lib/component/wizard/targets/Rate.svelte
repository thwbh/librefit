<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { AlertBox, AlertType, ListPicker, type ListPickerData } from '@thwbh/veilchen';

	interface Props {
		value: number;
		rates: Array<number>;
		targetDates: Map<number, string>;
		targetProgress: Map<number, number>;
	}

	let { value = $bindable(), rates, targetDates, targetProgress }: Props = $props();

	const data: Array<ListPickerData> = rates.map((rate) => {
		return {
			value: rate,
			header: `${rate} kcal`,
			description: `With a deficit of ${rate} kcal per day, you will lose ${targetProgress.get(rate)} kg per week. 
          Following through, your plan ends on ${convertDateStrToDisplayDateStr(targetDates.get(rate)!)}.`,
			label: rate === 500 ? { text: 'Recommended', className: 'badge-primary' } : undefined
		};
	});
</script>

<AlertBox type={AlertType.Info} alertClass="alert-soft">
	<strong>Please review and choose.</strong>
	<span class="text-xs">
		A higher deficit means faster weight loss, but is also harder to maintain. Many people consider
		a value around 500 kcal as sweet spot.
	</span>
</AlertBox>

<ListPicker bind:value {data} />
