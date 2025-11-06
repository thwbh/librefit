<script lang="ts">
	import type { LibreUser } from '$lib/api/gen';
	import { Avatar, AvatarPicker, ModalDialog, SwipeableListItem } from '@thwbh/veilchen';
	import { ArrowUUpLeft, HandSwipeLeft, HandSwipeRight, Shuffle } from 'phosphor-svelte';
	import { getAvatar } from '$lib/avatar';

	interface Props {
		userData: LibreUser;
		onAvatarChange?: (newAvatar: string) => void;
	}

	let { userData = $bindable(), onAvatarChange }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	// Temporary state for modal (only committed on confirm)
	let tempSelectedAvatar = $state('');
	let tempRandomSeed = $state('');

	// Local reactive copies to force re-renders
	let localName = $state(userData.name || '');
	let localAvatar = $state(userData.avatar || '');

	// Watch for changes to userData properties and update local state
	$effect(() => {
		localName = userData.name || '';
		localAvatar = userData.avatar || '';
	});

	// Current confirmed avatar based on local reactive state
	let currentAvatar = $derived(localAvatar !== '' ? getAvatar(localAvatar) : getAvatar(localName));

	const openModal = () => {
		// Initialize temp state with current confirmed state
		const currentAvatarValue = userData.avatar || userData.name!;
		const isDefaultAvatar = currentAvatarValue && defaults.indexOf(currentAvatarValue) > -1;

		// If user selected a default avatar, show username in random slot to avoid duplicates
		// Otherwise show the current avatar (username or randomized)
		if (isDefaultAvatar) {
			tempRandomSeed = userData.name!;
		} else {
			tempRandomSeed = currentAvatarValue;
		}

		tempSelectedAvatar = currentAvatarValue;
		dialog?.showModal();
	};

	const handleCancel = () => {
		// Discard temp changes
		tempRandomSeed = '';
		tempSelectedAvatar = '';
	};

	const handleConfirm = () => {
		// Commit the selected avatar
		userData.avatar = tempSelectedAvatar;
		onAvatarChange?.(tempSelectedAvatar);
	};

	const defaults = ['Bryan', 'Kimberbly', 'Andrea', 'Aidan', 'Jude', 'Jack', 'George'];

	// Temp avatar shown in modal while user is picking
	let tempRandomAvatar = $derived(getAvatar(tempRandomSeed));

	// Get the src for the currently selected avatar in the modal
	let tempSelectedAvatarSrc = $derived(getAvatar(tempSelectedAvatar));

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
		tempRandomSeed = userData.name!;
		tempSelectedAvatar = userData.name!;
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
						src={tempSelectedAvatarSrc}
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
