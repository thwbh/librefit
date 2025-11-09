<script lang="ts">
	import { CalculationSexSchema, type BodyData } from '$lib/api/gen';
	import { AlertBox, AlertType } from '@thwbh/veilchen';
	import { goto } from '$app/navigation';
	import { Cake, GenderFemale, GenderMale, Ruler, Scales } from 'phosphor-svelte';

	interface Props {
		bodyData: BodyData;
	}

	let { bodyData }: Props = $props();

	function runWizard() {
		goto('/wizard');
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Body Composition</h2>
	</div>

	<AlertBox type={AlertType.Info}>
		<span>
			Changing your body composition requires running the setup wizard again. These parameters
			affect your personalized fitness journey.
		</span>
	</AlertBox>

	<div class="card bg-base-200">
		<div class="card-body">
			<div class="grid grid-cols-1 gap-4">
				<!-- Sex -->
				<div class="flex items-center gap-4">
					<div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
						{#if bodyData.sex === CalculationSexSchema.enum.MALE}
							<GenderMale size="1.5em" class="text-primary" />
						{:else if bodyData.sex === CalculationSexSchema.enum.FEMALE}
							<GenderFemale size="1.5em" class="text-primary" />
						{/if}
					</div>
					<div class="flex-1">
						<p class="text-sm opacity-70">Biological Sex</p>
						<p class="text-lg font-semibold">
							{bodyData.sex === CalculationSexSchema.enum.MALE ? 'Male' : 'Female'}
						</p>
					</div>
				</div>

				<!-- Age -->
				<div class="flex items-center gap-4">
					<div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
						<Cake size="1.5em" class="text-primary" />
					</div>
					<div class="flex-1">
						<p class="text-sm opacity-70">Age</p>
						<p class="text-lg font-semibold">{bodyData.age} years</p>
					</div>
				</div>

				<!-- Height -->
				<div class="flex items-center gap-4">
					<div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
						<Ruler size="1.5em" class="text-primary" />
					</div>
					<div class="flex-1">
						<p class="text-sm opacity-70">Height</p>
						<p class="text-lg font-semibold">{bodyData.height} cm</p>
					</div>
				</div>

				<!-- Weight -->
				<div class="flex items-center gap-4">
					<div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
						<Scales size="1.5em" class="text-primary" />
					</div>
					<div class="flex-1">
						<p class="text-sm opacity-70">Starting Weight</p>
						<p class="text-lg font-semibold">{bodyData.weight} kg</p>
					</div>
				</div>
			</div>

			<div class="card-actions justify-end mt-4">
				<button class="btn btn-outline" onclick={runWizard}>
					<span>Re-run Setup Wizard</span>
				</button>
			</div>
		</div>
	</div>
</div>
