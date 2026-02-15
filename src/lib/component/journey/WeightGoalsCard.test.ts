import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WeightGoalsCard from './WeightGoalsCard.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';

// Setup common mocks
setupVeilchenMock();

describe('WeightGoalsCard Component', () => {
	it('should render start and target labels', () => {
		render(WeightGoalsCard, {
			props: {
				initialWeight: 85,
				targetWeight: 80
			}
		});

		expect(screen.getByText('Start')).toBeInTheDocument();
		expect(screen.getByText('Target')).toBeInTheDocument();
	});

	it('should render weight difference', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				initialWeight: 85,
				targetWeight: 80
			}
		});

		expect(screen.getByText('5.0 kg')).toBeInTheDocument();
		expect(container).toBeDefined();
	});

	it('should handle weight gain scenario', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				initialWeight: 60,
				targetWeight: 70
			}
		});

		expect(screen.getByText('10.0 kg')).toBeInTheDocument();
		expect(container).toBeDefined();
	});
});
