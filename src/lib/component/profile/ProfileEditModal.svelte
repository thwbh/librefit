<script lang="ts">
	import type { LibreUser } from '$lib/api';
	import { LibreUserSchema } from '$lib/api/gen/types';
	import {
		AlertBox,
		AlertType,
		AlertVariant,
		Avatar,
		ModalDialog,
		ValidatedInput
	} from '@thwbh/veilchen';
	import { slide } from 'svelte/transition';
	import { getAvatar } from '$lib/avatar';
	import { useFieldValidity } from '$lib/composition/useFieldValidity.svelte';
	import AvatarPickerContent from './AvatarPickerContent.svelte';

	interface Props {
		dialog?: HTMLDialogElement;
		entry: LibreUser | null | undefined;
		errorMessage?: string;
		onsave: (event?: Event) => Promise<boolean> | boolean | void;
		oncancel: () => void;
	}

	let {
		dialog = $bindable(),
		entry = $bindable(),
		errorMessage,
		onsave,
		oncancel
	}: Props = $props();

	let showAvatarPicker = $state(false);

	// Reset modal-internal state whenever the modal opens (entry goes from
	// absent → present): the avatar picker view, and the deferred-validation
	// hasAttempted flag (otherwise a previous "Confirm with invalid nickname"
	// would carry an immediate alert into the next session).
	let lastEntryPresent = false;
	$effect(() => {
		const present = !!entry;
		if (present && !lastEntryPresent) {
			showAvatarPicker = false;
			validity.reset();
		}
		lastEntryPresent = present;
	});

	const currentAvatar = $derived(getAvatar(entry?.avatar || entry?.name || ''));

	// [PF-010] / [VAL-013]: gate Save at the UI so a sub-min nickname never
	// round-trips to the backend. maxlength on the input already prevents the
	// 41-char case from happening; minlength is informational natively
	// (ModalDialog isn't a form), so we enforce it explicitly here.
	//
	// [VAL-014]: drive the message off the generated Zod schema so the frontend
	// hint and any later backend rejection produce the same string.
	const nameSchema = LibreUserSchema.shape.name;
	const validity = useFieldValidity({
		matches: '#profile-name',
		source: () => entry?.name,
		validate: (value) => {
			const result = nameSchema.safeParse(value);
			return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
		}
	});

	// Per [VAL-012] / [VAL-013]: don't pre-emptively disable Confirm; gate the
	// actual save behind `validity.attempt()` and shake on the first invalid
	// attempt of each "still invalid" period.
	let shaken = $state(false);
	let shakeKey = $state(0);

	$effect(() => {
		if (validity.displayValid) shaken = false;
	});

	function handleConfirmClick(event?: Event) {
		if (validity.attempt()) {
			onsave(event);
			return;
		}
		if (!shaken) {
			shaken = true;
			shakeKey++;
		}
	}

	function handleCancel() {
		showAvatarPicker = false;
		oncancel();
	}
</script>

<ModalDialog bind:dialog oncancel={handleCancel} onconfirm={handleConfirmClick}>
	{#snippet title()}
		<h3 class="text-lg font-bold">Edit Profile</h3>
	{/snippet}

	{#snippet content()}
		<div class="space-y-6" oninput={validity.handleInput}>
			{#if !showAvatarPicker && entry}
				<div class="flex flex-col items-center gap-4" transition:slide>
					<Avatar
						size="lg"
						ring
						ringColor="ring-secondary"
						src={currentAvatar}
						onclick={() => (showAvatarPicker = true)}
					/>
					<p class="text-sm opacity-70">Tap avatar to change</p>
				</div>

				<ValidatedInput
					id="profile-name"
					label="Nickname"
					type="text"
					bind:value={entry.name!}
					minlength={2}
					maxlength={40}
					required
				>
					Nickname must be between 2 and 40 characters long.
				</ValidatedInput>

				{#if errorMessage || validity.showError}
					<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>
						{errorMessage ?? validity.errorMessage}
					</AlertBox>
				{/if}
			{:else if entry}
				<div transition:slide>
					<AvatarPickerContent
						userName={entry.name!}
						currentAvatar={entry.avatar}
						bind:selectedAvatar={entry.avatar}
					/>
					<div class="mt-4 flex gap-2">
						<button class="btn btn-ghost flex-1" onclick={() => (showAvatarPicker = false)}>
							Done
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		{#key shakeKey}
			<button
				class="btn btn-primary confirm-button"
				class:shake={shakeKey > 0}
				onclick={handleConfirmClick}
			>
				Confirm
			</button>
		{/key}
		<button class="btn" onclick={handleCancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}

	.confirm-button.shake {
		animation: shake 0.3s ease-in-out;
	}
</style>
