<script>
	import { run } from 'svelte/legacy';

	import { AppBar, Avatar, getDrawerStore, ProgressBar } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	const drawerStore = getDrawerStore();

	const user = getContext('user');
	run(() => {
		user;
	});

	const indicator = getContext('indicator');
	run(() => {
		indicator;
	});

	export const showDrawer = (e) => {
		drawerStore.open({
			width: 'xl:w-1/3 md:w-3/5 w-full'
		});
	};
</script>

<ProgressBar
	class={$indicator.invisible}
	height="h-1"
	rounded="rounded-none"
	value={$indicator.progress}
	meter={$indicator.meter}
	track={$indicator.track}
/>
<AppBar shadow="drop-shadow">
	{#snippet lead()}
		<a href="/dashboard" class="h1 text-2xl">
			<span class="flex flex-row gap-1">
				<span class="text-primary-500"> Libre </span>
				<span class="text-secondary-500"> Fit </span>
			</span>
		</a>
	{/snippet}
	{#snippet trail()}
		<button onclick={showDrawer}>
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
