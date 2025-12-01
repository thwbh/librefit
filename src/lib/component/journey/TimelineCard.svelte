<script lang="ts">
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { Confetti, RocketLaunch } from 'phosphor-svelte';

	interface Props {
		startDate: string;
		endDate: string;
	}

	let { startDate, endDate }: Props = $props();
</script>

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
					{convertDateStrToDisplayDateStr(startDate)}
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
					{convertDateStrToDisplayDateStr(endDate)}
				</p>
			</div>
		</div>
	</div>
</div>
