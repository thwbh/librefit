<script lang="ts">
	import Profile from '$lib/component/profile/Profile.svelte';

	let { data } = $props();

	let userData = $state(data.userProfile);
	const bodyData = data.bodyData;
</script>

<div class="flex flex-col gap-4 p-6">
	<Profile bind:userData {bodyData} />
</div>
