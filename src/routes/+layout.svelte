<script lang="ts">
	import '../style.css';
	import { setUserContext, setCategoriesContext } from '$lib/context';

	let { data, children } = $props();

	// Set contexts for all child components to access
	// This eliminates prop drilling for commonly-used data
	setUserContext(data.userProfile);
	setCategoriesContext(data.foodCategories);
</script>

{@render children()}
