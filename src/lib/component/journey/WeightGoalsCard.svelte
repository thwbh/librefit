<script lang="ts">
	import { StatCard } from '@thwbh/veilchen';

	interface Props {
		currentWeight: number;
		targetWeight: number;
	}

	let { currentWeight, targetWeight }: Props = $props();
</script>

<div class="bg-base-100">
	<div class="stats stats-horizontal shadow w-full flex-col">
		<StatCard title="Current Weight" value={currentWeight} description="kg" />
		<StatCard
			title="Target Weight"
			value={targetWeight}
			description="kg"
			valueClass="text-primary"
		/>
	</div>
</div>
