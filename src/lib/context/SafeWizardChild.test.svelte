<script>
	import { tryGetWizardContext } from './wizard';

	const state = tryGetWizardContext();
</script>

<div data-testid="safe-wizard-child">
	<span data-testid="has-context">{state ? 'has context' : 'no context'}</span>
</div>
