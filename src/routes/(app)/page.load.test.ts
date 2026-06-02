import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/api/gen', () => ({
	dailyDashboard: vi.fn().mockResolvedValue({ marker: 'dashboard' })
}));

vi.mock('$lib/date', () => ({
	getDateAsStr: () => '2026-05-28'
}));

import { load } from './+page';
import { dailyDashboard } from '$lib/api/gen';

describe('dashboard load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('[AS-007] fetches dashboard data fresh on every navigation and registers the invalidation key', async () => {
		const depends = vi.fn();
		// The load runs on each navigation; calling dailyDashboard here (not a
		// cached value) is what makes the page show fresh data per AS-007.
		const data = (await load({ depends } as never)) as { dashboardData: unknown };

		expect(dailyDashboard).toHaveBeenCalledTimes(1);
		// `depends('data:dashboardData')` lets CRUD invalidate + refetch (AS-008
		// link) — and proves the data isn't served from a stale cache.
		expect(depends).toHaveBeenCalledWith('data:dashboardData');
		expect(data.dashboardData).toEqual({ marker: 'dashboard' });
	});
});
