<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { WizardOptions } from '$lib/enum';
	import { WizardRecommendationSchema } from '$lib/api/gen';
	import { ListPicker } from '@thwbh/veilchen';

	const WizardRecommendation = WizardRecommendationSchema.enum;

	interface Props {
		value: WizardOptions;
		details: unknown;
		recommendation: string;
	}

	let { value = $bindable(), details, recommendation }: Props = $props();

	const data = [
		{
			value: WizardOptions.Default,
			header: 'Take my initial values.',
			description: `I'm fine with what you presented before, set the weight target based on my input.`
		},
		{
			value: WizardOptions.Recommended,
			header: `I'll take your recommendation.`,
			description: `I want to ${recommendation.toLowerCase()}
			${recommendation === WizardRecommendation.HOLD ? 'my' : 'some'}
			weight. Create a target for that.`,
			label: {
				text: 'Recommended',
				className: 'badge-primary'
			}
		}
	];

	if (details) {
		if (value === WizardOptions.Custom_weight) {
			data.push({
				value: WizardOptions.Custom_weight,
				header: `I want to reach my dream weight.`,
				description: `How can I get to my target weight of ${details}kg as fast as possible?`
			});
		}

		if (value === WizardOptions.Custom_date) {
			data.push({
				value: WizardOptions.Custom_date,
				header: `I have a timeline in mind.`,
				description: `How much can I achieve until ${convertDateStrToDisplayDateStr(details as string)}?`
			});
		}
	}
</script>

<div></div>

<ListPicker bind:value {data}>
	{#snippet header()}
		Let me assist you with a few suggestions. I created a set of targets for you to choose depending
		on what you want to achieve. You can also set your own, if preferred.
	{/snippet}
</ListPicker>
