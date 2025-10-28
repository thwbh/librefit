<script lang="ts">
	import Profile from '$lib/component/profile/Profile.svelte';
	import { getUserContext } from '$lib/context';

	let { data } = $props();

	const userContext = getUserContext();
	let userData = $state(userContext.user);
	const bodyData = data.bodyData;
</script>

<div class="flex flex-col gap-4 p-6">
	<Profile bind:userData {bodyData} />
</div>
