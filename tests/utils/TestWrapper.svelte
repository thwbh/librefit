<script lang="ts">
	import { setCategoriesContext } from '$lib/context';
	import type { Component } from 'svelte';

	interface Props {
		component: Component;
		props?: Record<string, any>;
		categories?: Array<{ shortvalue: string; longvalue: string }>;
	}

	let { component, props = {}, categories = [] }: Props = $props();

	// Set context if categories provided
	if (categories.length > 0) {
		setCategoriesContext(categories);
	}
</script>

<svelte:component this={component} {...props} />
