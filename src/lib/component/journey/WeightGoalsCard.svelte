<script lang="ts">
	interface Props {
		currentWeight: number;
		targetWeight: number;
	}

	let { currentWeight, targetWeight }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-3">
	<div class="rounded-box bg-base-100 border border-base-300 p-4 flex flex-col gap-1">
		<span class="text-xs font-medium opacity-60 uppercase tracking-wide">Current Weight</span>
		<span class="text-3xl font-bold text-base-content">{currentWeight}</span>
		<span class="text-sm text-base-content/60">kg</span>
	</div>
	<div class="rounded-box bg-base-100 border border-base-300 p-4 flex flex-col gap-1">
		<span class="text-xs font-medium opacity-60 uppercase tracking-wide">Target Weight</span>
		<span class="text-3xl font-bold text-primary">{targetWeight}</span>
		<span class="text-sm text-base-content/60">kg</span>
	</div>
</div>
