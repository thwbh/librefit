<script lang="ts">
	import { getContext } from 'svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import type { Writable } from 'svelte/store';
	import type { LibreUser } from '$lib/model';
	import { updateProfile } from '$lib/api/user';
	import UserProfileComponent from '$lib/components/UserProfileComponent.svelte';

	const user: Writable<LibreUser> = getContext('user');

	const toastStore = getToastStore();
	const profileData = $user;

	const updateUserData = async (name: string, avatar: string) => {
		const userData: LibreUser = $user;
		$user.name = name;
		$user.avatar = avatar;

		await updateProfile(userData)
			.then(async (response) => {
				showToastSuccess(toastStore, 'Successfully updated profile.');

				user.set(response);
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
</script>

<svelte:head>
	<title>LibreFit - Profile</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1 class="h1">Profile</h1>
		<p>Change your user settings.</p>

		<UserProfileComponent
			name={profileData.name}
			avatar={profileData.avatar}
			onUpdateProfile={updateUserData}
		/>
	</div>
</section>
