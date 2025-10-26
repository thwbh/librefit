<script lang="ts">
	import { AlertBox, AlertType, OptionCards, type OptionCardData } from '@thwbh/veilchen';
	import {
		Barbell,
		OfficeChair,
		PersonSimpleRun,
		PersonSimpleTaiChi,
		Trophy
	} from 'phosphor-svelte';
	import { createRawSnippet } from 'svelte';

	interface Props {
		value: number;
	}

	let { value = $bindable() }: Props = $props();

	const data: Array<OptionCardData<string | number>> = [
		{
			value: 1,
			header: 'Mostly Sedentary',
			badge: { text: 'Level 1', color: 'info' },
			text: 'You likely have an office job and try your best reaching your daily step goal. Apart from that, you do not work out regularly and spend most of your day stationary.'
		},
		{
			value: 1.25,
			header: 'Light Activity',
			badge: { text: 'Level 2', color: 'info' },
			text: 'You either have a job that requires you to move around frequently or you hit the gym 2x - 3x times a week. In either way, you are regularly lifting weight and training your cardiovascular system.'
		},
		{
			value: 1.5,
			header: 'Moderate Activity',
			badge: { text: 'Level 3', color: 'info' },
			text: 'You consistently train your body 3x - 4x times a week. Your training plan became more sophisticated over the years and include cardiovascular HIIT sessions. You realized how important nutrition is and want to improve your sportive results.'
		},
		{
			value: 1.75,
			header: 'Highly Active',
			badge: { text: 'Level 4', color: 'warning' },
			text: 'Fitness is your top priority in life. You dedicate large parts of your week to train your body, maybe even regularly visit sportive events. You work out almost every day and certainly know what you are doing.'
		},
		{
			value: 2,
			header: 'Athlete',
			badge: { text: 'Level 5', color: 'error' },
			text: "Your fitness level reaches into the (semi-) professional realm. Calculators like this won't fulfill your needs and you are curious how far off the results will be."
		}
	];
</script>

<div class="flex flex-col gap-4">
	<OptionCards bind:value {data} scrollable={false}>
		{#snippet icon(option)}
			{@const size = '2.75em'}
			<span class="p-4">
				{#if option.value === 1}
					<OfficeChair {size} />
				{:else if option.value === 1.25}
					<PersonSimpleTaiChi {size} />
				{:else if option.value === 1.5}
					<PersonSimpleRun {size} />
				{:else if option.value === 1.75}
					<Barbell {size} />
				{:else if option.value === 2}
					<Trophy {size} />
				{/if}
			</span>
		{/snippet}
	</OptionCards>

	<AlertBox type={AlertType.Info}>
		<strong>Please be honest.</strong>
		<p class="text-sm">
			The descriptions are in no way meant to be judgemental and are a rough estimate of how your
			day looks like. If your goal is weight loss and you are unsure what to pick, just assume one
			level lower.
		</p>
	</AlertBox>
</div>
