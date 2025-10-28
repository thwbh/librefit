<script lang="ts">
	import { Avatar, ButtonGroup, RangeInput, ValidatedInput } from '@thwbh/veilchen';
	import type { KeyValuePair } from '@thwbh/veilchen';
	import { CalculationSexSchema, type LibreUser, type WizardInput } from '$lib/api/gen';
	import UserAvatar from '$lib/component/profile/UserAvatar.svelte';

	interface Props {
		wizardInput: WizardInput;
		userInput: LibreUser;
	}

	let { wizardInput = $bindable(), userInput = $bindable() }: Props = $props();

	let sexSelection: Array<KeyValuePair> = [
		{ key: CalculationSexSchema.enum.MALE, value: 'Male' },
		{ key: CalculationSexSchema.enum.FEMALE, value: 'Female' }
	];
</script>

<div class="p-4">
	<fieldset class="fieldset">
		<div class="mt-4 space-y-4">
			<div class="bg-base-100 flex items-center gap-4 rounded-lg">
				<div class="flex-1">
					<ValidatedInput
						type="text"
						minlength={2}
						maxlength={40}
						bind:value={userInput.name!}
						label="Nickname"
						required
					/>
				</div>
				<UserAvatar {userInput} onAvatarChange={(newAvatar) => (userInput.avatar = newAvatar)} />
			</div>
		</div>

		<ButtonGroup label="Sex" bind:value={wizardInput.sex} entries={sexSelection} />

		<span class="flex flex-col gap-4">
			<RangeInput label="Age" min={18} max={99} bind:value={wizardInput.age} />

			<RangeInput label="Height" min={100} max={220} unit="cm" bind:value={wizardInput.height} />

			<RangeInput label="Weight" min={30} max={300} unit="kg" bind:value={wizardInput.weight} />
		</span>
	</fieldset>
</div>
