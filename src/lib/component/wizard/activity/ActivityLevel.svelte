<script lang="ts">
	import { AlertBox, AlertType, ListPicker, type ListPickerData } from '@thwbh/veilchen';

	interface Props {
		value: number;
	}

	let { value = $bindable() }: Props = $props();

	const data: Array<ListPickerData> = [
		{
			value: 1,
			header: 'Mostly Sedentary',
			description: `You likely have an office job and try your best reaching your daily step goal. Apart from
				that, you do not work out regularly and spend most of your day stationary.`,
			label: { text: 'Level 1', className: ' badge-outline', activeClassName: 'badge-primary' }
		},
		{
			value: 1.25,
			header: 'Light Activity',
			description: `You either have a job that requires you to move around frequently or you hit the gym 2x - 3x
				times a week. In either way, you are regularly lifting weight and training your
				cardiovascular system.`,
			label: { text: 'Level 2', className: ' badge-outline', activeClassName: 'badge-primary' }
		},
		{
			value: 1.5,
			header: 'Moderate Activity',
			description: `You consistently train your body 3x - 4x times a week. Your training plan became more
				sophisticated over the years and include cardiovascular HIIT sessions. You realized how
				important nutrition is and want to improve your sportive results.`,
			label: { text: 'Level 3', className: ' badge-outline', activeClassName: 'badge-primary' }
		},
		{
			value: 1.75,
			header: 'Highly Active',
			description: `Fitness is your top priority in life. You dedicate large parts of your week to train your
				body, maybe even regularly visit sportive events. You work out almost every day and
				certainly know what you are doing.`,
			label: { text: 'Level 4', className: ' badge-outline', activeClassName: 'badge-primary' }
		},
		{
			value: 2,
			header: 'Athlete',
			description: `Your fitness level reaches into the (semi-) professional realm. Calculators like this won't
				fulfill your needs and you are curious how far off the results will be.`,
			label: { text: 'Level 5', className: ' badge-outline', activeClassName: 'badge-primary' }
		}
	];
</script>

<div class="flex flex-col gap-4">
	<ListPicker bind:value {data}>
		{#snippet header()}
			How active are you during your day? Choose what describes your daily activity level best.
		{/snippet}
	</ListPicker>

	<AlertBox type={AlertType.Info}>
		<strong>Please be honest.</strong>
		<span class="text-xs">
			The descriptions are in no way meant to be judgemental and are a rough estimate of how your
			day looks like. If your goal is weight loss and you are unsure what to pick, just assume one
			level lower.
		</span>
	</AlertBox>
</div>
