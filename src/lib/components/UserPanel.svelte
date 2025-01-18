<script lang="ts">
	import { page } from '$app/stores';
	import { Avatar, getDrawerStore, LightSwitch } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import Dashboard from '$lib/assets/icons/dashboard.svg?component';
	import Wand from '$lib/assets/icons/wand.svg?component';
	import User from '$lib/assets/icons/user.svg?component';
	import GitHub from '$lib/assets/icons/github.svg?component';
	import Food from '$lib/assets/icons/food.svg?component';
	import Scale from '$lib/assets/icons/scale-outline.svg?component';
	import FileTypeCsv from '$lib/assets/icons/file-type-csv.svg?component';
	import ChartLine from '$lib/assets/icons/chart-line.svg?component';
	import PieChart from '$lib/assets/icons/chart-pie-4.svg?component';
	import type { LibreUser } from '$lib/model';
	import type { Writable } from 'svelte/store';

	const drawerStore = getDrawerStore();

	const user: Writable<LibreUser> = getContext('user');

	let classesActive = $derived((href: string) =>
		href === $page.url.pathname ? '!variant-soft-primary' : ''
	);

	const navigate = () => {
		drawerStore.close();
	};
</script>

<div class="container mx-auto p-8 space-y-10">
	<div class="flex flex-row gap-6 justify-between">
		<div class="flex flex-row gap-6">
			<span>
				<Avatar src={$user.avatar} initials="LU" width="w-16" />
			</span>
			<div class="flex flex-col justify-evenly">
				<p>
					{$user.name}
				</p>
			</div>
		</div>

		<div>
			<LightSwitch />
		</div>
	</div>

	<nav class="list-nav">
		<ul>
			<li>
				<a href="/" class={classesActive('/')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<Dashboard />
					</span>
					<span class="flex-auto"> Dashboard </span>
				</a>
			</li>
			<li>
				<a href="/profile" class={classesActive('/profile')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<User />
					</span>
					<span class="flex-auto"> Profile </span>
				</a>
			</li>
			<li>
				<a href="/wizard" class={classesActive('/wizard')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<Wand />
					</span>
					<span class="flex-auto"> Wizard </span>
				</a>
			</li>
			<li>
				<a href="/tracker/calories" class={classesActive('/tracker/calories')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<Food />
					</span>
					<span class="flex-auto"> Calorie Tracker </span>
				</a>
			</li>
			<li>
				<a
					href="/tracker/calories/distribution"
					class={classesActive('/tracker/calories/distribution')}
					onclick={navigate}
				>
					<span class="badge-icon variant-glass-surface">
						<PieChart />
					</span>
					<span class="flex-auto"> Calorie Distribution </span>
				</a>
			</li>
			<li>
				<a href="/tracker/weight" class={classesActive('/tracker/weight')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<Scale />
					</span>
					<span class="flex-auto"> Weight Tracker </span>
				</a>
			</li>
			<li>
				<a
					href="/tracker/weight/chart"
					class={classesActive('/tracker/weight/chart')}
					onclick={navigate}
				>
					<span class="badge-icon variant-glass-surface">
						<ChartLine />
					</span>
					<span class="flex-auto"> Weight Progress </span>
				</a>
			</li>
			<li>
				<a href="/import" class={classesActive('/import')} onclick={navigate}>
					<span class="badge-icon variant-glass-surface">
						<FileTypeCsv />
					</span>
					<span class="flex-auto"> Import data </span>
				</a>
			</li>
			<li>
				<a href="https://github.com/tohuwabohu-io/librefit" target="_blank">
					<span class="badge-icon variant-glass-surface">
						<GitHub />
					</span>
					<span class="flex-auto"> GitHub </span>
				</a>
			</li>
		</ul>
	</nav>
</div>
