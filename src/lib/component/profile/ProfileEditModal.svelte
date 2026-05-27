<script lang="ts">
	import type { LibreUser } from '$lib/api';
	import { Avatar, ModalDialog, ValidatedInput } from '@thwbh/veilchen';
	import { slide } from 'svelte/transition';
	import { getAvatar } from '$lib/avatar';
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

	// Reset the picker to the form view whenever the modal opens (entry goes
	// from absent → present). The picker is modal-internal state; the parent
	// route doesn't need to know about it.
	let lastEntryPresent = false;
	$effect(() => {
		const present = !!entry;
		if (present && !lastEntryPresent) showAvatarPicker = false;
		lastEntryPresent = present;
	});

	const currentAvatar = $derived(getAvatar(entry?.avatar || entry?.name || ''));

	// PF-010 / PF-011: gate Save at the UI so a sub-min nickname never round-trips
	// to the backend. maxlength on the input already prevents the 41-char case from
	// happening; minlength does not block submission natively (ModalDialog isn't a
	// form), so we enforce it explicitly here.
	const isNicknameValid = $derived.by(() => {
		const n = entry?.name;
		return typeof n === 'string' && n.length >= 2 && n.length <= 40;
	});

	function handleCancel() {
		showAvatarPicker = false;
		oncancel();
	}
</script>

<ModalDialog bind:dialog oncancel={handleCancel} onconfirm={onsave}>
	{#snippet title()}
		<h3 class="text-lg font-bold">Edit Profile</h3>
	{/snippet}

	{#snippet content()}
		<div class="space-y-6">
			{#if errorMessage}
				<div class="alert alert-error">
					<span>{errorMessage}</span>
				</div>
			{/if}

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
		<button class="btn btn-primary" onclick={onsave} disabled={!isNicknameValid}>Confirm</button>
		<button class="btn" onclick={handleCancel}>Cancel</button>
	{/snippet}
</ModalDialog>
