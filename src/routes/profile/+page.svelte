<script lang="ts">
	import Profile from '$lib/component/profile/Profile.svelte';
	import { getUserContext } from '$lib/context';

	let { data } = $props();

	const userProfile = getUserContext();
	let userData = $state(userProfile);
	const bodyData = data.bodyData;
</script>

<div class="flex flex-col gap-4 p-6">
	<Profile bind:userData {bodyData} />
</div>
