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

	// Initialize temp state
	let tempRandomSeed = $state('');
	let tempSelectedAvatar = $state('');

	$effect(() => {
		const currentAvatarValue = currentAvatar || userName;
		const isDefaultAvatar = currentAvatarValue && defaults.indexOf(currentAvatarValue) > -1;

		if (isDefaultAvatar) {
			tempRandomSeed = userName;
		} else {
			tempRandomSeed = currentAvatarValue;
		}

		tempSelectedAvatar = selectedAvatar || currentAvatarValue;
	});

	// Update bindable when tempSelectedAvatar changes
	$effect(() => {
		selectedAvatar = tempSelectedAvatar;
		onSelect?.(tempSelectedAvatar);
	});

	let tempRandomAvatar = $derived(getAvatar(tempRandomSeed));

	const loreleis = [...defaults].map((seed) => {
		return {
			id: seed,
			src: getAvatar(seed)
		};
	});

	let avatars = $derived.by(() => {
		return [{ id: tempRandomSeed, src: tempRandomAvatar }, ...loreleis];
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

		tempRandomSeed = outString;
		tempSelectedAvatar = outString;
	};

	const reset = () => {
		tempRandomSeed = userName;
		tempSelectedAvatar = userName;
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
