import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EncouragementMessage from './EncouragementMessage.svelte';
import { setupVeilchenMock } from '../../../../tests/utils/mocks';

// Setup common mocks
setupVeilchenMock();

describe('EncouragementMessage Component', () => {
	const defaultProps = {
		daysElapsed: 10,
		daysLeft: 100,
		averageIntake: 0,
		targetCalories: 1800,
		goalReached: false
	};

	it('should render a contextual message', () => {
		const { container } = render(EncouragementMessage, { props: defaultProps });

		expect(container.querySelector('.text-sm')).toBeDefined();
	});

	it('should show goal reached message', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, goalReached: true }
		});

		expect(container.textContent).toContain('You did it!');
	});

	it('should show near-end message when close to finish', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, daysLeft: 10, daysElapsed: 100, averageIntake: 1500 }
		});

		expect(container.textContent).toContain('finish line');
	});

	it('should show early start message for new journeys', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, daysElapsed: 1, daysLeft: 120 }
		});

		expect(container.textContent).toContain('Great start');
	});

	it('should show no-data message when average intake is zero', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, averageIntake: 0 }
		});

		expect(container.textContent).toContain('Consistency');
	});

	it('should show on-target message when average is within target', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, averageIntake: 1700, targetCalories: 1800 }
		});

		expect(container.textContent).toContain('within your daily target');
	});

	it('should show above-target message when averaging over', () => {
		const { container } = render(EncouragementMessage, {
			props: { ...defaultProps, averageIntake: 2100, targetCalories: 1800 }
		});

		expect(container.textContent).toContain('above target');
	});
});
