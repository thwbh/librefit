import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CaloriePlanCard from './CaloriePlanCard.svelte';

// Mock NumberFlow
vi.mock('@number-flow/svelte', () => {
	const NumberFlowMock = function (anchor: any, props: any) {
		const value = props?.value ?? 0;
		const textNode = document.createTextNode(String(value));

		if (anchor && anchor.parentNode) {
			anchor.parentNode.insertBefore(textNode, anchor);
		}

		return {
			p: (newProps: any) => {
				if (newProps.value !== undefined) {
					textNode.textContent = String(newProps.value);
				}
			},
			d: () => {
				if (textNode.parentNode) {
					textNode.parentNode.removeChild(textNode);
				}
			}
		};
	};

	return {
		default: NumberFlowMock
	};
});

describe('CaloriePlanCard Component', () => {
	it('should render calorie plan title', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(screen.getByText('Calorie Plan')).toBeInTheDocument();
	});

	it('should display hero target calories number', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(container.textContent).toContain('1800');
		expect(container.textContent).toContain('kcal / day');
	});

	it('should display planned deficit for weight loss', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(container.textContent).toContain('Planned deficit');
		expect(container.textContent).toContain('500 kcal');
	});

	it('should display planned surplus for weight gain', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'GAIN',
				dailyRate: 300,
				targetCalories: 2500,
				maximumCalories: 2800
			}
		});

		expect(container.textContent).toContain('Planned surplus');
		expect(container.textContent).toContain('300 kcal');
	});

	it('should display goal label for weight loss', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(container.textContent).toContain('Lose Weight');
	});

	it('should display goal label for weight gain', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'GAIN',
				dailyRate: 300,
				targetCalories: 2500,
				maximumCalories: 2800
			}
		});

		expect(container.textContent).toContain('Gain Weight');
	});

	it('should display target calories in bar label', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(container.textContent).toContain('Target');
		expect(container.textContent).toContain('1800 kcal');
	});

	it('should handle HOLD recommendation', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'HOLD',
				dailyRate: 0,
				targetCalories: 2200,
				maximumCalories: 2400
			}
		});

		expect(container.textContent).toContain('Maintain Weight');
		expect(container.textContent).toContain('2200');
	});

	it('should show maintenance message for HOLD', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'HOLD',
				dailyRate: 0,
				targetCalories: 2200,
				maximumCalories: 2400
			}
		});

		expect(container.textContent).toMatch(/maintain current weight/i);
	});

	it('should not show daily rate when HOLD with zero rate', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'HOLD',
				dailyRate: 0,
				targetCalories: 2200,
				maximumCalories: 2400
			}
		});

		expect(container.textContent).not.toContain('Planned adjustment');
	});

	it('should render target bar', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		const bar = container.querySelector('.bg-primary.rounded-full');
		expect(bar).toBeTruthy();
	});

	it('should render average intake bar when provided', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000,
				averageIntake: 1600
			}
		});

		expect(container.textContent).toContain('1600 kcal');
		expect(container.textContent).toContain('Your average');
		const bar = container.querySelector('.bg-accent.rounded-full');
		expect(bar).toBeTruthy();
	});

	it('should show accent bar when average exceeds target', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000,
				averageIntake: 1900
			}
		});

		const bar = container.querySelector('.bg-accent.rounded-full');
		expect(bar).toBeTruthy();
	});

	it('should show no data message when average intake is zero', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000,
				averageIntake: 0
			}
		});

		expect(container.textContent).toContain('No data yet');
	});

	it('should apply correct styling', () => {
		const { container } = render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		const card = container.querySelector('.bg-base-100.rounded-box.p-6.shadow');
		expect(card).toBeDefined();
	});
});
