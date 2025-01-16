<script lang="ts">
	import { RangeSlider } from '@skeletonlabs/skeleton';


	let {
		rangeValue = $bindable(),
		rangeMin,
		rangeMax,
		name,
		label
	} = $props();
</script>

<RangeSlider
	accent="accent-primary-500"
	name="height"
	bind:value={rangeValue}
	min={rangeMin}
	max={rangeMax}
	aria-hidden="true"
>
	<div class="flex flex-row justify-between">
		<span class="self-center">{label}</span>
		<span
			><input class="input" {name} type="text" bind:value={rangeValue} aria-label={label} />
		</span>
	</div>
</RangeSlider>
