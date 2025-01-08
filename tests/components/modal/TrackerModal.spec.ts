import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import TargetModal from '$lib/components/modal/TargetModal.svelte';
import { tick } from 'svelte';
import { getDateAsStr } from '$lib/date';
import { addYears } from 'date-fns';
import { updateModalStoreMock } from '../../__mocks__/skeletonProxy';

/**
 * @vitest-environment jsdom
 */
describe('TargetModal.svelte component', () => {
	afterEach(() => cleanup());

	const today = new Date();

	it('should fill in the form for a calorie target and submit', async () => {
		const mockData = { calorieTarget: {} };

		const responseCallback = vi.fn();
		updateModalStoreMock({ meta: mockData, callback: responseCallback });

		const { getByRole } = render(TargetModal);
		await fireEvent.input(getByRole('spinbutton', { name: 'Target intake kcal' }), {
			target: { value: 1800 }
		});
		await fireEvent.input(getByRole('spinbutton', { name: 'Maximum intake kcal' }), {
			target: { value: 2000 }
		});
		await fireEvent.click(getByRole('button', { name: 'Submit' }));
		await tick();

		expect(responseCallback).toHaveBeenCalledTimes(1);

		const expectedDetail = {
			calorieTarget: {
				added: getDateAsStr(today),
				startDate: getDateAsStr(today),
				endDate: getDateAsStr(addYears(new Date(), 1)),
				targetCalories: '1800',
				maximumCalories: '2000'
			}
		};

		expect(responseCallback).toHaveBeenCalledWith(expectedDetail);
	});

	it('should fill in the form for a weight target and submit', async () => {
		const mockData = { weightTarget: {} };

		const responseCallback = vi.fn();
		updateModalStoreMock({ meta: mockData, callback: responseCallback });

		const { getByRole } = render(TargetModal);
		await fireEvent.input(getByRole('spinbutton', { name: 'Starting weight kg' }), {
			target: { value: 80 }
		});
		await fireEvent.input(getByRole('spinbutton', { name: 'Target weight kg' }), {
			target: { value: 75 }
		});
		await fireEvent.click(getByRole('button', { name: 'Submit' }));
		await tick();

		expect(responseCallback).toHaveBeenCalledTimes(1);

		const expectedDetail = {
			weightTarget: {
				added: getDateAsStr(today),
				startDate: getDateAsStr(today),
				endDate: getDateAsStr(addYears(new Date(), 1)),
				initialWeight: '80',
				targetWeight: '75'
			}
		};

		expect(responseCallback).toHaveBeenCalledWith(expectedDetail);
	});

	it('should accept currentTarget from props', async () => {
		const mockData = {
			calorieTarget: {
				added: '2024-05-01',
				startDate: '2024-05-01',
				endDate: '2025-05-01',
				targetCalories: '1800',
				maximumCalories: '2000'
			},
			weightTarget: {
				added: '2024-05-01',
				startDate: '2024-05-01',
				endDate: '2025-05-01',
				initialWeight: '67',
				targetWeight: '65'
			}
		};

		updateModalStoreMock({ meta: mockData });

		const { getByRole } = render(TargetModal);

		expect(getByRole('spinbutton', { name: 'Target intake kcal' })['value']).toBe(
			mockData.calorieTarget.targetCalories
		);
		expect(getByRole('spinbutton', { name: 'Maximum intake kcal' })['value']).toBe(
			mockData.calorieTarget.maximumCalories
		);
		expect(getByRole('spinbutton', { name: 'Starting weight kg' })['value']).toBe(
			mockData.weightTarget.initialWeight
		);
		expect(getByRole('spinbutton', { name: 'Target weight kg' })['value']).toBe(
			mockData.weightTarget.targetWeight
		);
	});

	it('should cancel the action', async () => {
		const mockData = {};

		const responseCallback = vi.fn();
		updateModalStoreMock({ meta: mockData, callback: responseCallback });

		const { getByRole } = render(TargetModal);

		await fireEvent.click(getByRole('button', { name: 'Cancel' }));
		await tick();

		expect(responseCallback).toHaveBeenCalledTimes(1);
		const expectedDetail = { cancelled: true };
		expect(responseCallback).toHaveBeenCalledWith(expectedDetail);
	});
});
