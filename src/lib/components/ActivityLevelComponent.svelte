<script lang="ts">
	import type { WizardInput } from '$lib/model';

	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

	interface Props {
		wizardInput: WizardInput;
	}

	let { wizardInput = $bindable() }: Props = $props();

	const activityLevels = [
		{ label: 'Mostly Sedentary', value: 1 },
		{ label: 'Light Activity', value: 1.25 },
		{ label: 'Moderate Activity', value: 1.5 },
		{ label: 'Highly Active', value: 1.75 },
		{ label: 'Athlete', value: 2 }
	];
</script>

<div>
	<p>How active are you during your day? Choose what describes your daily activity level best.</p>
	<p>
		Please be honest, the descriptions are in no way meant to be judgemental and are a rough
		estimate of how your day looks like. If your goal is weight loss and you are unsure what to
		pick, just assume one level less.
	</p>

	<div class="activity-level-container flex gap-4">
		<RadioGroup flexDirection="flex-col" rounded="rounded-container-token">
			{#each activityLevels as activityLevel}
				<RadioItem
					bind:group={wizardInput.activityLevel}
					name="activityLevel"
					value={activityLevel.value}
				>
					{activityLevel.label}
				</RadioItem>
			{/each}
		</RadioGroup>

		<div class="card variant-glass-secondary p-4 text-left space-y-2 flex-auto w-64">
			{#if wizardInput.activityLevel === 1}
				<strong>Level 1 - Mostly Sedentary</strong>
				<p>
					You likely have an office job and try your best reaching your daily step goal. Apart from
					that, you do not work out regularly and spend most of your day stationary.
				</p>
			{:else if wizardInput.activityLevel === 1.25}
				<strong>Level 2 - Light Activity</strong>
				<p>
					You either have a job that requires you to move around frequently or you hit the gym 2x -
					3x times a week. In either way, you are regularly lifting weight and training your
					cardiovascular system.
				</p>
			{:else if wizardInput.activityLevel === 1.5}
				<strong>Level 3 - Moderate Activity</strong>
				<p>
					You consistently train your body 3x - 4x times a week. Your training plan became more
					sophisticated over the years and include cardiovascular HIIT sessions. You realized how
					important nutrition is and want to improve your sportive results.
				</p>
			{:else if wizardInput.activityLevel === 1.75}
				<strong>Level 4 - Highly Active</strong>
				<p>
					Fitness is your top priority in life. You dedicate large parts of your week to train your
					body, maybe even regularly visit sportive events. You work out almost every day and
					certainly know what you are doing.
				</p>
			{:else if wizardInput.activityLevel === 2}
				<strong>Level 5 - Athlete</strong>
				<p>
					Your fitness level reaches into the (semi-) professional realm. Calculators like this
					won't fulfill your needs and you are curious how far off the results will be.
				</p>
			{/if}
		</div>
	</div>
</div>
