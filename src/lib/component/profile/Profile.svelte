<script lang="ts">
	import type { BodyData, LibreUser } from '$lib/api/gen';
	import ProfileHeader from './ProfileHeader.svelte';
	import BodyDataDisplay from './BodyDataDisplay.svelte';

	interface Props {
		userData: LibreUser;
		bodyData: BodyData;
	}

	let { userData = $bindable(), bodyData }: Props = $props();

	function handleUserUpdate(updated: LibreUser) {
		userData = updated;
	}
</script>

<div class="space-y-6">
	<!-- Profile Header with swipe-to-edit -->
	<ProfileHeader {userData} onUpdate={handleUserUpdate} />

	<!-- Body Data Display (read-only) -->
	<BodyDataDisplay {bodyData} />
</div>
