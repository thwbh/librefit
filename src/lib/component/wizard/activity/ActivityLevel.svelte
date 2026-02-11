<script lang="ts">
	import {
		AlertBox,
		AlertType,
		AlertVariant,
		OptionCards,
		type OptionCardData
	} from '@thwbh/veilchen';
	import { activityLevels } from '$lib/activity';

	interface Props {
		value: number;
	}

	let { value = $bindable() }: Props = $props();

	const data: Array<OptionCardData<string | number>> = activityLevels.map((level) => ({
		value: level.level,
		header: level.label,
		badge: level.badge,
		text: level.description
	}));
</script>

<div class="flex flex-col gap-4">
	<OptionCards bind:value {data} scrollable={false}>
		{#snippet icon(option)}
			{@const size = '2.75em'}
			{@const activityInfo = activityLevels.find((a) => a.level === option.value)}
			{#if activityInfo}
				{@const Icon = activityInfo.icon}
				<span class="p-4">
					<Icon {size} />
				</span>
			{/if}
		{/snippet}
	</OptionCards>

	<AlertBox type={AlertType.Info} variant={AlertVariant.Callout}>
		<strong>Please be honest.</strong>
		<p class="text-sm">
			The descriptions are in no way meant to be judgemental and are a rough estimate of how your
			day looks like. If your goal is weight loss and you are unsure what to pick, just assume one
			level lower.
		</p>
	</AlertBox>
</div>
