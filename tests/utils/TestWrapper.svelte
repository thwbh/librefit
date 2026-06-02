<script lang="ts">
	import { setCategoriesContext, setUserContext } from '$lib/context';
	import type { LibreUser } from '$lib/api/gen';
	import type { Component } from 'svelte';

	interface Props {
		component: Component<any, any, any>;
		props?: Record<string, any>;
		categories?: Array<{ shortvalue: string; longvalue: string }>;
		user?: LibreUser | null;
	}

	let { component, props = {}, categories = [], user = null }: Props = $props();

	// Forward the inner props through `$state` so nested data (e.g. an `entry`
	// object a component mutates and binds to) is a reactive proxy — mirroring how
	// the real callers pass `$state`-backed data via `bind:`. Without this, a
	// component mutating a plain prop object wouldn't re-render under Svelte 5
	// (binding_property_non_reactive).
	let liveProps = $state(props);

	// Set context if categories provided
	if (categories.length > 0) {
		setCategoriesContext(categories);
	}

	// Set user context if requested (even if explicitly null/undefined, so getUserContext won't throw)
	if (user !== null) {
		setUserContext(user);
	}

	// Svelte 5 dynamic component syntax
	const Component = component;
</script>

<Component {...liveProps} />
