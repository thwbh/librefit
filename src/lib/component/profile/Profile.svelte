<script lang="ts">
	import type { LibreUser } from '$lib/model';
	import { ValidatedInput } from '@thwbh/veilchen';

	interface Props {
		userData: LibreUser;
	}

	let { userData = $bindable() }: Props = $props();
</script>

<div>
	<fieldset class="fieldset">
		<ValidatedInput type="text" label="username" value={userData.name} required={false}>
			foo
		</ValidatedInput>
	</fieldset>
</div>
