<script lang="ts">
	import {
		ChartMixedOutline,
		DotsVerticalOutline,
		HomeOutline,
		ListOutline
	} from 'flowbite-svelte-icons';
	import Settings from './settings/Settings.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		activeRoute: string;
	}

	let { activeRoute = undefined }: Props = $props();

	const navigate = (route: string) => {
		goto(route);
	};

	const activeClass = (route: string) => (activeRoute === route ? 'dock-active' : '');
</script>

{#if activeRoute}
	<div class="dock dock-md">
		<button class={activeClass('/')} onclick={() => goto('/')}>
			<HomeOutline width="24px" height="24px" />
			<span class="dock-label">Home</span>
		</button>

		<button class={activeClass('/progress')} onclick={() => navigate('/progress')}>
			<ChartMixedOutline width="24px" height="24px" />
			<span class="dock-label">Progress</span>
		</button>

		<button class={activeClass('/history')} onclick={() => navigate('/history')}>
			<ListOutline width="24px" height="24px" />
			<span class="dock-label">History</span>
		</button>

		<div class="dropdown dropdown-top">
			<div tabindex="0" role="button" class="flex flex-col items-center p-2">
				<DotsVerticalOutline width="24px" height="24px" />
				<span class="dock-label">Settings</span>
			</div>
			<Settings />
		</div>
	</div>
{/if}
