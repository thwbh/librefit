<script lang="ts">
	import '../style.css';
	import { setUserContext, setCategoriesContext } from '$lib/context';

	let { data, children } = $props();

	// Set contexts for all child components to access
	// This eliminates prop drilling for commonly-used data
	// Note: userProfile may be null for unauthenticated routes (about, wizard)
	setUserContext(data.userProfile);
	setCategoriesContext(data.foodCategories);
</script>

{@render children()}
