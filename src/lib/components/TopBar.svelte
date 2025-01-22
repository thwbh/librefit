<script lang="ts">
	import type { LibreUser } from '$lib/model';
	import { AppBar, Avatar, getDrawerStore } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	const drawerStore = getDrawerStore();
	const user: Writable<LibreUser> = getContext('user');

	console.log($user);

	export const showDrawer = () => {
		drawerStore.open({
			width: 'xl:w-1/3 md:w-3/5 w-full'
		});
	};

	$effect(() => console.log(user));
</script>

<AppBar shadow="drop-shadow">
	{#snippet lead()}
		<a href="/" class="h1 text-2xl">
			<span class="flex flex-row gap-1">
				<span class="text-primary-500"> Libre </span>
				<span class="text-secondary-500"> Fit </span>
			</span>
		</a>
	{/snippet}
	{#snippet trail()}
		<button onclick={() => showDrawer()}>
			<Avatar
				src={$user.avatar}
				initials="LU"
				width="w-12"
				border="border-4 border-surface-300-600-token hover:!border-primary-500"
				cursor="cursor-pointer"
			/>
		</button>
	{/snippet}
</AppBar>
