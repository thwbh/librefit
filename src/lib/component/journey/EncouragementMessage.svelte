<script lang="ts">
	import { AlertBox, AlertType, AlertVariant } from '@thwbh/veilchen';

	interface Props {
		daysElapsed: number;
		daysLeft: number;
		averageIntake: number;
		targetCalories: number;
		goalReached: boolean;
	}

	let { daysElapsed, daysLeft, averageIntake, targetCalories, goalReached }: Props = $props();

	const message = $derived.by(() => {
		if (goalReached) {
			return { text: 'You did it! Consider setting a new goal.', type: AlertType.Success };
		}
		if (daysLeft <= 14 && daysLeft > 0) {
			return { text: 'The finish line is in sight! Stay strong.', type: AlertType.Info };
		}
		if (daysElapsed < 3) {
			return { text: 'Great start! Build the habit one day at a time.', type: AlertType.Info };
		}
		if (averageIntake === 0) {
			return { text: 'Consistency beats perfection. Keep tracking!', type: AlertType.Warning };
		}
		if (averageIntake <= targetCalories) {
			return { text: "You're within your daily target — keep it up!", type: AlertType.Success };
		}
		return {
			text: "You're averaging above target. Small adjustments help!",
			type: AlertType.Warning
		};
	});
</script>

<AlertBox type={message.type} variant={AlertVariant.Callout}>
	<p class="text-sm">{message.text}</p>
</AlertBox>
