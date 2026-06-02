import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WizardParent from './WizardParent.test.svelte';
import MissingContext from './MissingContext.test.svelte';
import SafeWizardChild from './SafeWizardChild.test.svelte';
import ContextWrapper from './ContextWrapper.test.svelte';
import UpdatingParent from './UpdatingParent.test.svelte';

describe('Wizard Context API', () => {
	it('[OB-001] child components can access wizard context set by parent', () => {
		render(WizardParent);

		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('500')).toBeInTheDocument();
		expect(screen.getByText('70')).toBeInTheDocument();
	});

	it('[OB-002] getWizardContext throws when context not found in child component', () => {
		render(MissingContext);

		expect(screen.getByText(/missing_context/)).toBeInTheDocument();
	});

	it('[OB-003] tryGetWizardContext returns null when context not found', () => {
		render(SafeWizardChild);

		expect(screen.getByText('no context')).toBeInTheDocument();
	});

	it('[OB-004] tryGetWizardContext returns state when context is set', () => {
		render(ContextWrapper);

		expect(screen.getByText('has context')).toBeInTheDocument();
	});

	it('[OB-005] context can be updated and child components see new values', () => {
		render(UpdatingParent);

		expect(screen.getByText('750')).toBeInTheDocument();
	});
});
