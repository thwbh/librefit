<script lang="ts">
	import { run, preventDefault } from 'svelte/legacy';

	import { getContext } from 'svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import type { Writable } from 'svelte/store';
	import type { LibreUser } from '$lib/model';
	import type { Indicator } from '$lib/indicator';
	import { updateProfile } from '$lib/api/user';
	import UserProfileComponent from '$lib/components/UserProfileComponent.svelte';

	const user: Writable<LibreUser> = getContext('user');
	run(() => {
		user;
	});

	const indicator: Writable<Indicator> = getContext('indicator');

	const toastStore = getToastStore();

	let btnSubmit: HTMLButtonElement;

	const onUpdateProfile = async (_: any) => {
		$indicator = $indicator.start(btnSubmit);

		await updateProfile($user)
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
			})
			.finally(() => ($indicator = $indicator.finish()));
	};
</script>

<svelte:head>
	<title>LibreFit - Profile</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1 class="h1">Profile</h1>
		<p>Change your user settings.</p>

		<UserProfileComponent user={$user} />

		<div class="flex justify-between">
			<button onclick={preventDefault(onUpdateProfile)} class="btn variant-filled-primary"
				>Update</button
			>
		</div>
	</div>
</section>
