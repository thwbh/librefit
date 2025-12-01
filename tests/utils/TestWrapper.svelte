<script lang="ts">
	import { setCategoriesContext } from '$lib/context';
	import type { Component } from 'svelte';

	interface Props {
		component: Component<any, any, any>;
		props?: Record<string, any>;
		categories?: Array<{ shortvalue: string; longvalue: string }>;
	}

	let { component, props = {}, categories = [] }: Props = $props();

	// Set context if categories provided
	if (categories.length > 0) {
		setCategoriesContext(categories);
	}

	// Svelte 5 dynamic component syntax
	const Component = component;
</script>

<Component {...props} />
