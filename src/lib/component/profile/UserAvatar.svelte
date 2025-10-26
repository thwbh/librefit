<script lang="ts">
	import type { LibreUser } from '$lib/api/gen';
	import {
		AlertBox,
		AlertType,
		Avatar,
		AvatarPicker,
		ModalDialog,
		SwipeableListItem,
		type AvatarOption
	} from '@thwbh/veilchen';
	import { createAvatar } from '@dicebear/core';
	import { lorelei } from '@dicebear/collection';
	import { ArrowUUpLeft, HandSwipeLeft, HandSwipeRight, Shuffle } from 'phosphor-svelte';

	interface Props {
		userInput: LibreUser;
	}

	let { userInput = $bindable() }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	// Temporary state for modal (only committed on confirm)
	let tempSelectedAvatar = $state('');
	let tempRandomSeed = $state('');

	// Current confirmed avatar (derived from userInput)
	let currentAvatar = $derived.by(() => {
		let avatar = userInput.avatar;
		let username = userInput.name!;

		// user picked a default avatar
		if (avatar && defaults.indexOf(avatar) > -1) {
			return getAvatar(avatar);
		} else if (avatar) {
			return getAvatar(avatar);
		} else {
			return getAvatar(username);
		}
	});

	const openModal = () => {
		// Initialize temp state with current confirmed state
		const isDefaultAvatar = userInput.avatar && defaults.indexOf(userInput.avatar) > -1;

		// If user selected a default avatar, show username in random slot to avoid duplicates
		// Otherwise show the current avatar (username or randomized)
		if (isDefaultAvatar) {
			tempRandomSeed = userInput.name!;
		} else {
			tempRandomSeed = userInput.avatar ? userInput.avatar : userInput.name!;
		}

		tempSelectedAvatar = userInput.avatar ? userInput.avatar : userInput.name!;
		dialog?.showModal();
	};

	const handleCancel = () => {
		// Discard temp changes
		tempRandomSeed = '';
		tempSelectedAvatar = '';
	};

	const handleConfirm = () => {
		// Commit the selected avatar
		userInput.avatar = tempSelectedAvatar;
	};

	const defaults = ['Bryan', 'Kimberbly', 'Andrea', 'Aidan', 'Jude', 'Jack', 'George'];

	const getAvatar = (seed: string): string => {
		return createAvatar(lorelei, {
			seed,
			flip: true,
			glassesProbability: 50,
			hairAccessoriesProbability: 0,
			mouth: [
				'happy01',
				'happy02',
				'happy03',
				'happy04',
				'happy05',
				'happy06',
				'happy07',
				'happy08',
				'happy09',
				'happy10',
				'happy11',
				'happy12',
				'happy13',
				'happy14',
				'happy15',
				'happy16',
				'happy17',
				'happy18'
			]
		}).toDataUri();
	};

	// Temp avatar shown in modal while user is picking
	let tempRandomAvatar = $derived(getAvatar(tempRandomSeed));

	// Pre-defined avatar options
	const loreleis = [...defaults].map((seed) => {
		return {
			id: seed,
			src: getAvatar(seed)
		};
	});

	const randomize = () => {
		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < 32; i++) {
			outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}

		// Ensure we don't accidentally generate a seed that matches a default
		while (defaults.indexOf(outString) > -1) {
			outString += Math.floor(Math.random() * 10);
		}

		tempRandomSeed = outString;
		tempSelectedAvatar = outString;
	};

	const reset = () => {
		tempRandomSeed = userInput.name!;
		tempSelectedAvatar = userInput.name!;
	};

	// Avatar options shown in picker (random + presets)
	let avatars = $derived.by(() => {
		return [{ id: tempRandomSeed, src: tempRandomAvatar }, ...loreleis];
	});
</script>

<Avatar size="lg" ring ringColor="ring-secondary" src={currentAvatar} onclick={openModal} />
<ModalDialog bind:dialog onconfirm={handleConfirm} oncancel={handleCancel}>
	{#snippet title()}
		<h2 class="text-2xl font-bold text-base-content mb-2">Customize Avatar</h2>
	{/snippet}
	{#snippet content()}
		<div>
			<span class="label flex flex-row"> </span>

			<SwipeableListItem onleft={randomize} onright={reset}>
				{#snippet leftAction()}
					<div>
						<Shuffle size="2em" />
					</div>
				{/snippet}
				{#snippet rightAction()}
					<div>
						<ArrowUUpLeft size="2em" />
					</div>
				{/snippet}
				<div
					class="border-t-base-content/5 flex items-center justify-between gap-2 border-t border-dashed py-2"
				>
					<span>
						<HandSwipeRight size="2em" class="opacity-40" />
					</span>
					<Avatar
						size="2xl"
						src={tempRandomAvatar}
						onclick={() => (tempSelectedAvatar = tempRandomSeed)}
					/>
					<span>
						<HandSwipeLeft size="2em" class="opacity-40" />
					</span>
				</div>
			</SwipeableListItem>
		</div>

		<AvatarPicker bind:value={tempSelectedAvatar} {avatars} size="xl" />
	{/snippet}
</ModalDialog>
