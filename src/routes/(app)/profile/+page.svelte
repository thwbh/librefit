<script lang="ts">
	import { SwipeableListItem } from '@thwbh/veilchen';
	import { getUserContext } from '$lib/context';
	import { IdentificationCard, PencilSimple } from 'phosphor-svelte';
	import type { LibreUser } from '$lib/api/index.js';
	import { updateUser } from '$lib/api/gen/commands';
	import UserAvatar from '$lib/component/profile/UserAvatar.svelte';
	import ProfileEditModal from '$lib/component/profile/ProfileEditModal.svelte';
	import BodyDataDisplay from '$lib/component/profile/BodyDataDisplay.svelte';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';

	let { data } = $props();

	const userContext = getUserContext();
	const bodyData = data.bodyData;

	let userData: LibreUser = $state(userContext.user)!;

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
			userData.name = updatedUser.name;
			userData.avatar = updatedUser.avatar;
		}
	});

	function openEdit() {
		modal.openEdit(userData);
	}
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">User Profile</h1>

	<!-- Branded Header -->
	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				<span class="text-2xl font-bold">Profile</span>
				<span class="text-sm opacity-70">Manage your personal information</span>
			</div>
			<span class="opacity-50">
				<IdentificationCard size="2.5rem" weight="duotone" />
			</span>
		</div>
	</div>

	<!-- Content card with overlap -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 p-4 pt-6 space-y-6">
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

<ProfileEditModal
	bind:dialog={modal.editDialog.value}
	bind:entry={modal.currentEntry}
	errorMessage={modal.errorMessage}
	onsave={modal.save}
	oncancel={modal.cancel}
/>
