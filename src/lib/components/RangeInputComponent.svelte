<script>
	import { RangeSlider } from '@skeletonlabs/skeleton';

	export let rangeValue;
	export let rangeMin;
	export let rangeMax;

	export let name;
	export let label;
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
