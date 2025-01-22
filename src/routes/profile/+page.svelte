<script lang="ts">
	import { getContext } from 'svelte';
	import { Avatar, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import type { Writable } from 'svelte/store';
	import type { LibreUser } from '$lib/model';
	import { getProfile, updateProfile } from '$lib/api/user';

	const modalStore = getModalStore();

	const user: Writable<LibreUser> = getContext('user');
	const toastStore = getToastStore();

	let avatarInput: HTMLInputElement;

	let promise = getProfile();

	const updateUserData = async (userData: LibreUser) => {
		await updateProfile(userData)
			.then(async (response) => {
				showToastSuccess(toastStore, 'Successfully updated profile.');

				user.set(response);

				promise = new Promise((resolve) => resolve(userData));
			})
			.catch((error) => {
				console.log(error);

				if (!error.data.error) {
					showToastWarning(toastStore, 'Please check your input.');
				} else {
					showToastError(toastStore, error);
				}
			});
	};

	const showAvatarPickerModal = (userData: LibreUser) => {
		modalStore.trigger({
			type: 'component',
			component: 'avatarModal',
			meta: {
				avatar: userData.avatar
			},
			response: (e) => {
				if (e && !e.cancelled) {
					userData.avatar = e.avatar;
				}

				modalStore.close();
			}
		});
	};
</script>

<svelte:head>
	<title>LibreFit - Profile</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1 class="h1">Profile</h1>
		<p>Change your user settings.</p>

		{#await promise then userData}
			<div class="variant-ringed p-4 space-y-4 rounded-container-token">
				<label class="label">
					<span>Nickname</span>
					<input
						bind:value={userData.name}
						name="username"
						class="input"
						type="text"
						placeholder="Enter Nickname"
					/>
				</label>

				<div class="flex flex-col gap-4">
					<span>Avatar</span>

					<div class="flex flex-row gap-4">
						<div>
							<Avatar bind:src={userData.avatar} initials="LU" />
						</div>

						<div class="justify-center self-center">
							<button
								onclick={() => showAvatarPickerModal(userData)}
								class="btn variant-filled-secondary">Change</button
							>
						</div>
						<input
							bind:this={avatarInput}
							bind:value={userData.avatar}
							name="avatar"
							type="text"
							style="visibility:hidden"
						/>
					</div>
				</div>
				<div class="flex justify-between">
					<button onclick={() => updateUserData(userData)} class="btn variant-filled-primary"
						>Update</button
					>
				</div>
			</div>
		{/await}
	</div>
</section>
