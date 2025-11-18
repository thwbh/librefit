import { assert, beforeAll, describe, expect, it } from 'vitest';
import { mockIPC } from '@tauri-apps/api/mocks';
import { randomFillSync } from 'crypto';
import { createIntakeTarget, createWeightTarget } from '../../../src/lib/api/gen';
import type { NewIntakeTarget, NewWeightTarget, WeightTarget } from '../../../src/lib/api/gen';

const mockIntakeTarget: NewIntakeTarget = {
	added: '2022-08-12',
	targetCalories: 2000,
	maximumCalories: 2500,
	startDate: '2025-01-01',
	endDate: '2025-12-31'
};

beforeAll(() => {
	Object.defineProperty(window, 'crypto', {
		value: {
			getRandomValues: (buffer: any) => {
				return randomFillSync(buffer);
			}
		}
	});
});

/**
 * @vitest-environment jsdom
 */
describe('createTarget functions', () => {
	it('createIntakeTarget should make API call and handle responses correctly', async () => {
		// testing successful API call
		mockIPC((cmd, args) => {
			return mockIntakeTarget;
		});

		const result = await createIntakeTarget({ newTarget: mockIntakeTarget });
		expect(result).toEqual(mockIntakeTarget);
	});

	it('createWeightTarget should make API call and handle responses correctly', async () => {
		const mockWeightTarget: NewWeightTarget = {
			added: '2022-08-12',
			initialWeight: 80,
			targetWeight: 70,
			startDate: '2025-01-01',
			endDate: '2025-12-31'
		};

		// testing successful API call
		mockIPC(() => {
			return mockWeightTarget;
		});

		const result = await createWeightTarget({ newTarget: mockWeightTarget });
		expect(result).toEqual(mockWeightTarget);
	});
});
