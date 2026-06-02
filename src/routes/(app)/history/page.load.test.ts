import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/api/gen', () => ({
	getTrackerHistory: vi.fn().mockResolvedValue({ marker: 'history' }),
	getLastIntakeTarget: vi.fn().mockResolvedValue({ marker: 'target' })
}));

import { load } from './+page';
import { getTrackerHistory, getLastIntakeTarget } from '$lib/api/gen';

describe('history load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('[AS-007] fetches history + target fresh on every navigation (not from cache)', async () => {
		const parent = vi.fn().mockResolvedValue({});
		const data = (await load({ parent } as never)) as {
			trackerHistory: unknown;
			intakeTarget: unknown;
		};

		expect(getTrackerHistory).toHaveBeenCalledTimes(1);
		expect(getLastIntakeTarget).toHaveBeenCalledTimes(1);
		expect(data.trackerHistory).toEqual({ marker: 'history' });
		expect(data.intakeTarget).toEqual({ marker: 'target' });
	});
});
