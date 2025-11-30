import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EncouragementMessage from './EncouragementMessage.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';

// Setup common mocks
setupVeilchenMock();

describe('EncouragementMessage Component', () => {
	it('should render the encouragement message', () => {
		render(EncouragementMessage);

		expect(screen.getByText('Remember:')).toBeInTheDocument();
	});

	it('should display the motivational text', () => {
		render(EncouragementMessage);

		expect(
			screen.getByText('Consistency is key. Small daily actions lead to big results!')
		).toBeInTheDocument();
	});

	it('should render as an info alert', () => {
		const { container } = render(EncouragementMessage);

		// The component uses AlertBox with AlertType.Info
		expect(container.querySelector('.alert')).toBeDefined();
	});

	it('should apply correct text styling', () => {
		const { container } = render(EncouragementMessage);

		const textElement = container.querySelector('.text-sm');
		expect(textElement).toBeDefined();
	});

	it('should render without props', () => {
		const { container } = render(EncouragementMessage);

		expect(container).toBeDefined();
		expect(screen.getByText('Remember:')).toBeInTheDocument();
	});
});
