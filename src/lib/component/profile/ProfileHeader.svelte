<script lang="ts">
	import { SwipeableListItem, ModalDialog, Avatar, ValidatedInput } from '@thwbh/veilchen';
	import { updateUser } from '$lib/api/gen/commands';
	import type { LibreUser } from '$lib/api';
	import UserAvatar from './UserAvatar.svelte';
	import AvatarPickerContent from './AvatarPickerContent.svelte';
	import { PencilSimple } from 'phosphor-svelte';
	import { getAvatar } from '$lib/avatar';
	import { slide } from 'svelte/transition';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';

	interface Props {
		userData: LibreUser;
		onUpdate?: (user: LibreUser) => void;
	}

	let { userData, onUpdate }: Props = $props();

	let showAvatarPicker = $state(false);
	let isNameValid = $state(false);

	const modal = useEntryModal<LibreUser, LibreUser>({
		onCreate: async () => {
			throw new Error('Create not supported for user profile');
		},
		onUpdate: async (_, entry) => {
			// Validate before update
			if (!isNameValid) {
				throw new Error('Please fix validation errors');
			}

			return await updateUser({
				userName: entry.name!,
				userAvatar: entry.avatar!
			});
		},
		onDelete: async () => {
			throw new Error('Delete not supported for user profile');
		},
		getBlankEntry: () => ({ ...userData }),
		onUpdateSuccess: (updatedUser) => {
			// Update local state
			userData.name = updatedUser.name;
			userData.avatar = updatedUser.avatar;

			onUpdate?.(updatedUser);
			showAvatarPicker = false;
		}
	});

	let currentAvatar = $derived(getAvatar(modal.currentEntry?.avatar || modal.currentEntry?.name!));

	function openEdit() {
		showAvatarPicker = false;
		modal.openEdit(userData);
	}

	function handleCancel() {
		showAvatarPicker = false;
		modal.cancel();
	}
</script>

<SwipeableListItem onleft={() => openEdit()}>
	{#snippet leftAction()}
		<PencilSimple size="1.5em" />
	{/snippet}

	<div class="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
		<div class="flex-1">
			<h2 class="text-2xl font-bold">{userData.name!}</h2>
			<p class="text-sm opacity-70">Tap to view, swipe to edit</p>
		</div>

		<UserAvatar {userData} />
	</div>
</SwipeableListItem>

<ModalDialog bind:dialog={modal.editDialog.value} oncancel={handleCancel} onconfirm={modal.save}>
	{#snippet title()}
		<h3 class="text-lg font-bold">Edit Profile</h3>
	{/snippet}

	{#snippet content()}
		<div class="space-y-6">
			{#if modal.errorMessage}
				<div class="alert alert-error">
					<span>{modal.errorMessage}</span>
				</div>
			{/if}

			{#if !showAvatarPicker && modal.currentEntry}
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
					bind:value={modal.currentEntry.name!}
					minlength={2}
					maxlength={40}
					required
				>
					Nickname must be between 2 and 40 characters long.
				</ValidatedInput>
			{:else if modal.currentEntry}
				<div transition:slide>
					<AvatarPickerContent
						userName={modal.currentEntry.name!}
						currentAvatar={modal.currentEntry.avatar}
						bind:selectedAvatar={modal.currentEntry.avatar}
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
</ModalDialog>
