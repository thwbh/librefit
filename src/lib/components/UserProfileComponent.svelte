<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	interface Props {
		name: string;
		avatar: string;
		showButton?: boolean;
		onUpdateProfile?: (name: string, avatar: string) => void;
	}

	let { name, avatar, showButton = true, onUpdateProfile }: Props = $props();

	const showAvatarPickerModal = () => {
		modalStore.trigger({
			type: 'component',
			component: 'avatarModal',
			meta: {
				avatar: avatar
			},
			response: (e) => {
				if (e && !e.cancelled) {
					avatar = e.avatar;
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
			bind:value={name}
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
				<Avatar src={avatar} initials="LU" />
			</div>

			<div class="justify-center self-center">
				<button onclick={() => showAvatarPickerModal()} class="btn variant-filled-secondary"
					>Change</button
				>
			</div>
			<input value={avatar} name="avatar" type="text" style="visibility:hidden" />
		</div>
	</div>

	{#if showButton === true}
		<div class="flex justify-between">
			<button onclick={() => onUpdateProfile(name, avatar)} class="btn variant-filled-primary"
				>Update</button
			>
		</div>
	{/if}
</div>
