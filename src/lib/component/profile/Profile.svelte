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
	<ProfileHeader user={userData} onUpdate={handleUserUpdate} />

	<!-- Body Data Display (read-only) -->
	<BodyDataDisplay {bodyData} />

	<!-- TODO: Data Import/Export Section -->
	<!-- <div class="space-y-4">
		<h2 class="text-xl font-bold">Data Management</h2>
		<div class="card bg-base-200">
			<div class="card-body">
				<button class="btn btn-outline">Import Data</button>
				<button class="btn btn-outline">Export Data</button>
			</div>
		</div>
	</div> -->
</div>
