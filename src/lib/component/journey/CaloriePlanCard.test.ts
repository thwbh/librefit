import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CaloriePlanCard from './CaloriePlanCard.svelte';

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

	it('should display daily deficit for weight loss', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(screen.getByText('Daily Deficit')).toBeInTheDocument();
		expect(screen.getByText('500 kcal')).toBeInTheDocument();
	});

	it('should display daily surplus for weight gain', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'GAIN',
				dailyRate: 300,
				targetCalories: 2500,
				maximumCalories: 2800
			}
		});

		expect(screen.getByText('Daily Surplus')).toBeInTheDocument();
		expect(screen.getByText('300 kcal')).toBeInTheDocument();
	});

	it('should display target intake with correct label for weight loss', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(screen.getByText('Target Intake (Loss)')).toBeInTheDocument();
		expect(screen.getByText('1800 kcal')).toBeInTheDocument();
	});

	it('should display target intake with correct label for weight gain', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'GAIN',
				dailyRate: 300,
				targetCalories: 2500,
				maximumCalories: 2800
			}
		});

		expect(screen.getByText('Target Intake (Gain)')).toBeInTheDocument();
		expect(screen.getByText('2500 kcal')).toBeInTheDocument();
	});

	it('should display maximum calories', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'LOSE',
				dailyRate: 500,
				targetCalories: 1800,
				maximumCalories: 2000
			}
		});

		expect(screen.getByText('Maximum Limit')).toBeInTheDocument();
		expect(screen.getByText('2000 kcal')).toBeInTheDocument();
	});

	it('should handle HOLD recommendation', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'HOLD',
				dailyRate: 0,
				targetCalories: 2200,
				maximumCalories: 2400
			}
		});

		expect(screen.getByText('Target Intake (Maintain)')).toBeInTheDocument();
		expect(screen.getByText('2200 kcal')).toBeInTheDocument();
	});

	it('should show maintenance message for HOLD', () => {
		render(CaloriePlanCard, {
			props: {
				recommendation: 'HOLD',
				dailyRate: 0,
				targetCalories: 2200,
				maximumCalories: 2400
			}
		});

		expect(
			screen.getByText(/Your calorie target is set to maintain your current weight/i)
		).toBeInTheDocument();
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

		// Should not show "Daily Adjustment" when rate is 0
		expect(screen.queryByText('Daily Adjustment')).not.toBeInTheDocument();
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
