<script lang="ts">
	import { House, ChartLine, ListBullets, DotsThreeVertical } from 'phosphor-svelte';
	import Settings from './settings/Settings.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		activeRoute?: string;
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
			<House size="1.25em" weight="bold" />
			<span class="dock-label">Home</span>
		</button>

		<button class={activeClass('/progress')} onclick={() => navigate('/progress')}>
			<ChartLine size="1.25em" weight="bold" />
			<span class="dock-label">Progress</span>
		</button>

		<button class={activeClass('/history')} onclick={() => navigate('/history')}>
			<ListBullets size="1.25em" weight="bold" />
			<span class="dock-label">History</span>
		</button>

		<div class="dropdown dropdown-top">
			<div tabindex="0" role="button" class="flex flex-col items-center p-2">
				<DotsThreeVertical size="1.25em" weight="bold" />
				<span class="dock-label">Settings</span>
			</div>
			<Settings />
		</div>
	</div>
{/if}
