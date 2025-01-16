<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import type { LibreUser } from '$lib/model';
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	interface Props {
		user: LibreUser;
	}

	let { user = $bindable() }: Props = $props();

	const showAvatarPickerModal = () => {
		modalStore.trigger({
			type: 'component',
			component: 'avatarModal',
			meta: {
				avatar: user.avatar
			},
			response: (e) => {
				if (e && !e.cancelled) {
					user.avatar = e.avatar;
				}

				modalStore.close();
			}
		});
	};
</script>

<div class="variant-ringed p-4 space-y-4 rounded-container-token">
	<label class="label">
		<span>Nickname</span>
		<input
			bind:value={user.name}
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
				<Avatar src={user.avatar} initials="LU" />
			</div>

			<div class="justify-center self-center">
				<button onclick={preventDefault(showAvatarPickerModal)} class="btn variant-filled-secondary"
					>Change</button
				>
			</div>
			<input bind:value={user.avatar} name="avatar" type="text" style="visibility:hidden" />
		</div>
	</div>
</div>
