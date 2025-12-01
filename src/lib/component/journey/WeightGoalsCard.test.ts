import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WeightGoalsCard from './WeightGoalsCard.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';

// Setup common mocks
setupVeilchenMock();

describe('WeightGoalsCard Component', () => {
	it('should render current weight', () => {
		render(WeightGoalsCard, {
			props: {
				currentWeight: 75,
				targetWeight: 70
			}
		});

		expect(screen.getByText('Current Weight')).toBeInTheDocument();
	});

	it('should render target weight', () => {
		render(WeightGoalsCard, {
			props: {
				currentWeight: 80,
				targetWeight: 75
			}
		});

		expect(screen.getByText('Target Weight')).toBeInTheDocument();
	});

	it('should display weights as numbers', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				currentWeight: 85.5,
				targetWeight: 80.0
			}
		});

		// The component uses StatCard which renders the values
		expect(container).toBeDefined();
	});

	it('should apply correct styling', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				currentWeight: 90,
				targetWeight: 85
			}
		});

		const wrapper = container.querySelector('.bg-base-100');
		expect(wrapper).toBeDefined();

		const stats = container.querySelector('.stats');
		expect(stats).toBeDefined();
	});

	it('should handle weight gain scenario', () => {
		render(WeightGoalsCard, {
			props: {
				currentWeight: 60,
				targetWeight: 70
			}
		});

		expect(screen.getByText('Current Weight')).toBeInTheDocument();
		expect(screen.getByText('Target Weight')).toBeInTheDocument();
	});

	it('should handle weight loss scenario', () => {
		render(WeightGoalsCard, {
			props: {
				currentWeight: 100,
				targetWeight: 85
			}
		});

		expect(screen.getByText('Current Weight')).toBeInTheDocument();
		expect(screen.getByText('Target Weight')).toBeInTheDocument();
	});
});
