<script lang="ts">
	import { getWizardContext } from './wizard';

	let errorMessage = 'no error';

	try {
		getWizardContext();
	} catch (e: any) {
		errorMessage = e.message;
	}
</script>

<div data-testid="missing-context">
	<span data-testid="error">{errorMessage}</span>
</div>
