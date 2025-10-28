<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { AlertBox, AlertType, Avatar, StatCard } from '@thwbh/veilchen';
	import { getAvatar } from '$lib/avatar';
	import { getActivityLevelInfo } from '$lib/activity';
	import { getWizardContext } from '$lib/context';
	import { Confetti, RocketLaunch } from 'phosphor-svelte';

	// Get wizard state from context instead of props
	const wizardState = getWizardContext();
	const { wizardResult, wizardInput, userInput, chosenRate, weightTarget, calorieTarget } =
		wizardState;

	let avatarSrc = $derived(getAvatar(userInput.avatar || userInput.name!));
	let activityInfo = $derived(getActivityLevelInfo(wizardInput.activityLevel || 1));
	let ActivityIcon = $derived(activityInfo.icon);

	// Determine if user is gaining, losing, or maintaining weight
	const recommendation = wizardResult?.recommendation || 'LOSE';
	const isGaining = recommendation === 'GAIN';
	const isHolding = recommendation === 'HOLD';

	// Dynamic labels based on goal
	const rateLabel = isGaining ? 'Daily Surplus' : isHolding ? 'Daily Adjustment' : 'Daily Deficit';
	const targetLabel = isGaining
		? 'Target Intake (Gain)'
		: isHolding
			? 'Target Intake (Maintain)'
			: 'Target Intake (Loss)';
	const maximumLabel = isGaining
		? 'Maximum Intake'
		: isHolding
			? 'Maximum Flexibility'
			: 'Maximum Limit';
</script>

<div class="flex flex-col gap-6">
	<!-- User Profile Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div class="flex items-center gap-6">
			<div class="flex-1 space-y-3">
				<div>
					<p class="text-sm text-base-content opacity-60">Nickname</p>
					<p class="text-xl font-bold text-base-content">{userInput?.name}</p>
				</div>
				<div class="flex items-center gap-3">
					<div>
						<p class="text-sm text-base-content opacity-60">Activity Level</p>
						<span class="flex flex-row gap-2">
							<ActivityIcon size="1.5em" />
							<p class="font-semibold text-base-content">{activityInfo.label}</p>
						</span>
					</div>
				</div>
			</div>
			<Avatar size="2xl" src={avatarSrc} />
		</div>
	</div>

	<!-- Weight Goals Card -->
	<div class="bg-base-100">
		<div class="stats stats-horizontal shadow w-full flex-col">
			<StatCard title="Current Weight" value={weightTarget!.initialWeight} description="kg" />
			<StatCard
				title="Target Weight"
				value={weightTarget!.targetWeight}
				description="kg"
				valueClass="text-primary"
			/>
		</div>
	</div>

	<!-- Calorie Plan Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
			Calorie Plan
		</h3>
		<div class="space-y-3">
			{#if !isHolding || chosenRate !== 0}
				<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
					<span class="text-base-content opacity-70">{rateLabel}</span>
					<span class="font-bold text-primary">{chosenRate} kcal</span>
				</div>
			{/if}
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">{targetLabel}</span>
				<span class="font-bold">{calorieTarget!.targetCalories} kcal</span>
			</div>
			<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
				<span class="text-base-content opacity-70">{maximumLabel}</span>
				<span class="font-bold" class:text-error={!isGaining && !isHolding}
					>{calorieTarget!.maximumCalories} kcal</span
				>
			</div>
		</div>
		{#if isHolding}
			<div class="mt-4 p-3 bg-info/10 rounded-lg">
				<p class="text-sm text-base-content opacity-80">
					Your calorie target is set to maintain your current weight. Stay within this range to keep
					your weight stable.
				</p>
			</div>
		{/if}
	</div>

	<!-- Timeline Card -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">Timeline</h3>
		<div class="space-y-4">
			<div class="flex items-center gap-4">
				<div
					class="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
				>
					<RocketLaunch size="1.5em" />
				</div>
				<div class="flex-1">
					<p class="text-sm text-base-content opacity-60">Start Date</p>
					<p class="font-semibold text-base-content">
						{convertDateStrToDisplayDateStr(weightTarget!.startDate)}
					</p>
				</div>
			</div>

			<div class="divider my-2"></div>

			<div class="flex items-center gap-4">
				<div
					class="flex-shrink-0 w-12 h-12 rounded-full bg-success/20 flex items-center justify-center"
				>
					<Confetti size="1.5em" />
				</div>
				<div class="flex-1">
					<p class="text-sm text-base-content opacity-60">Target Date</p>
					<p class="font-semibold text-base-content">
						{convertDateStrToDisplayDateStr(weightTarget!.endDate)}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Encouragement Message -->
	<AlertBox type={AlertType.Info}>
		<strong>Remember:</strong>
		<p class="text-sm">Consistency is key. Small daily actions lead to big results!</p>
	</AlertBox>
</div>
