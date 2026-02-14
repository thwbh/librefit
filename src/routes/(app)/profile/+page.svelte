<script lang="ts">
	import {
		Breadcrumbs,
		TextSize,
		SwipeableListItem,
		ModalDialog,
		Avatar,
		ValidatedInput
	} from '@thwbh/veilchen';
	import type { BreadcrumbItem } from '@thwbh/veilchen';
	import { getUserContext } from '$lib/context';
	import { IdentificationCard, PencilSimple } from 'phosphor-svelte';
	import type { LibreUser } from '$lib/api/index.js';
	import { updateUser } from '$lib/api/gen/commands';
	import UserAvatar from '$lib/component/profile/UserAvatar.svelte';
	import AvatarPickerContent from '$lib/component/profile/AvatarPickerContent.svelte';
	import BodyDataDisplay from '$lib/component/profile/BodyDataDisplay.svelte';
	import { getAvatar } from '$lib/avatar';
	import { slide } from 'svelte/transition';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import SettingsIcon from '$lib/component/navigation/SettingsIcon.svelte';

	let { data } = $props();

	const userContext = getUserContext();
	const bodyData = data.bodyData;

	let userData: LibreUser = $state(userContext.user)!;
	let showAvatarPicker = $state(false);

	const modal = useEntryModal<LibreUser, LibreUser>({
		onCreate: async () => {
			throw new Error('Create not supported for user profile');
		},
		onUpdate: async (_, entry) => {
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

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: SettingsIcon
		},
		{
			id: '2',
			href: '/profile',
			label: 'Profile',
			icon: IdentificationCard,
			iconProps: { weight: 'bold' }
		}
	];
</script>

<div class="p-4">
	<h1 class="sr-only">User Profile</h1>
	<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

	<div class="space-y-6">
		<!-- Profile Header with swipe-to-edit -->
		<SwipeableListItem onleft={() => openEdit()}>
			{#snippet leftAction()}
				<PencilSimple size="1.5em" />
			{/snippet}

			<div class="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
				<div class="flex-1">
					<h2 class="text-2xl font-bold">{userData.name!}</h2>
					<p class="text-sm opacity-70">Swipe to edit</p>
				</div>

				<UserAvatar {userData} readonly={true} />
			</div>
		</SwipeableListItem>

		<!-- Body Data Display (read-only) -->
		<BodyDataDisplay {bodyData} />
	</div>
</div>

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
