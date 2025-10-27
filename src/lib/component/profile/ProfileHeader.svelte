<script lang="ts">
	import { SwipeableListItem, ModalDialog } from '@thwbh/veilchen';
	import type { LibreUser } from '$lib/api/gen';
	import { updateUser } from '$lib/api/gen';
	import UserAvatar from './UserAvatar.svelte';
	import { PencilSimple } from 'phosphor-svelte';

	interface Props {
		user: LibreUser;
		onUpdate?: (user: LibreUser) => void;
	}

	let { user, onUpdate }: Props = $props();

	let editDialog = $state<HTMLDialogElement>();
	let editedUser = $state<LibreUser>({ ...user });
	let isSaving = $state(false);
	let error = $state<string | null>(null);

	function openEdit() {
		editedUser = { ...user };
		error = null;
		editDialog?.showModal();
	}

	function cancel() {
		editedUser = { ...user };
		error = null;
		editDialog?.close();
	}

	async function save() {
		if (!editedUser.name || editedUser.name.trim().length < 2) {
			error = 'Name must be at least 2 characters';
			return;
		}

		isSaving = true;
		try {
			const updated = await updateUser({
				userName: editedUser.name,
				userAvatar: editedUser.avatar!
			});

			// Update local state
			user.name = updated.name;
			user.avatar = updated.avatar;

			onUpdate?.(updated);
			editDialog?.close();
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update profile';
		} finally {
			isSaving = false;
		}
	}
</script>

<SwipeableListItem onleft={() => openEdit()}>
	{#snippet leftAction()}
		<PencilSimple size="1.5em" />
	{/snippet}

	<div class="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
		<div class="flex-1">
			<h2 class="text-2xl font-bold">{user.name!}</h2>
			<p class="text-sm opacity-70">Tap to view, swipe to edit</p>
		</div>

		<UserAvatar userInput={user} />
	</div>
</SwipeableListItem>

<ModalDialog bind:dialog={editDialog}>
	{#snippet title()}
		<h3 class="text-lg font-bold">Edit Profile</h3>
	{/snippet}

	{#snippet content()}
		<div class="space-y-6">
			{#if error}
				<div class="alert alert-error">
					<span>{error}</span>
				</div>
			{/if}

			<div class="flex flex-col items-center gap-4">
				<UserAvatar
					userInput={editedUser}
					onAvatarChange={(newAvatar) => (editedUser.avatar = newAvatar)}
				/>
				<p class="text-sm opacity-70">Tap avatar to change</p>
			</div>

			<div class="form-control">
				<label class="label" for="profile-name">
					<span class="label-text">Nickname</span>
				</label>
				<input
					id="profile-name"
					type="text"
					class="input input-bordered w-full"
					bind:value={editedUser.name}
					minlength="2"
					maxlength="40"
					required
				/>
				<span class="label">
					<span class="label-text-alt">Minimum 2 characters</span>
				</span>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn" onclick={cancel} disabled={isSaving}>Cancel</button>
		<button class="btn btn-primary" onclick={save} disabled={isSaving}>
			{#if isSaving}
				<span class="loading loading-spinner loading-sm"></span>
				Saving...
			{:else}
				Save
			{/if}
		</button>
	{/snippet}
</ModalDialog>
