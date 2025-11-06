<script lang="ts">
	import { Avatar, AvatarPicker, SwipeableListItem } from '@thwbh/veilchen';
	import { ArrowUUpLeft, HandSwipeLeft, HandSwipeRight, Shuffle } from 'phosphor-svelte';
	import { getAvatar } from '$lib/avatar';

	interface Props {
		userName: string;
		currentAvatar?: string;
		selectedAvatar?: string;
		onSelect?: (avatar: string) => void;
	}

	let { userName, currentAvatar, selectedAvatar = $bindable(), onSelect }: Props = $props();

	const defaults = ['Bryan', 'Kimberbly', 'Andrea', 'Aidan', 'Jude', 'Jack', 'George'];

	// Track the random seed separately - this is what appears in position 1
	// Only initialize once, don't react to changes
	const currentAvatarValue = currentAvatar || userName;
	const isDefaultAvatar = currentAvatarValue && defaults.indexOf(currentAvatarValue) > -1;
	let randomSeed = $state(isDefaultAvatar ? userName : currentAvatarValue);

	// Initialize with current/selected avatar
	// If current avatar matches random seed, select the random slot (__random__)
	// Otherwise, select the preset (which will be one of the defaults)
	let tempSelectedAvatar = $state(
		currentAvatarValue === randomSeed ? '__random__' : currentAvatar || '__random__'
	);

	// Update bindable when tempSelectedAvatar changes
	// Translate '__random__' to actual randomSeed value
	$effect(() => {
		const actualValue = tempSelectedAvatar === '__random__' ? randomSeed : tempSelectedAvatar;
		selectedAvatar = actualValue;
		onSelect?.(actualValue);
	});

	let randomAvatarSrc = $derived(getAvatar(randomSeed));

	// Get the src for the currently selected avatar
	let selectedAvatarSrc = $derived(
		tempSelectedAvatar === '__random__' ? randomAvatarSrc : getAvatar(tempSelectedAvatar)
	);

	const loreleis = [...defaults].map((seed) => {
		return {
			id: seed,
			src: getAvatar(seed)
		};
	});

	// Position 1 is always the random avatar, rest are preset avatars
	// Use '__random__' as a stable ID for the random slot
	let avatars = $derived.by(() => {
		return [{ id: '__random__', src: randomAvatarSrc }, ...loreleis];
	});

	const randomize = () => {
		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < 32; i++) {
			outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}

		while (defaults.indexOf(outString) > -1) {
			outString += Math.floor(Math.random() * 10);
		}

		// Update random seed and select the random slot
		randomSeed = outString;
		tempSelectedAvatar = '__random__';
	};

	const reset = () => {
		// Reset to username-based avatar
		randomSeed = userName;
		tempSelectedAvatar = '__random__';
	};
</script>

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
				src={selectedAvatarSrc}
				onclick={() => (tempSelectedAvatar = '__random__')}
			/>
			<span>
				<HandSwipeLeft size="2em" class="opacity-40" />
			</span>
		</div>
	</SwipeableListItem>
</div>

<AvatarPicker bind:value={tempSelectedAvatar} {avatars} size="xl" />
