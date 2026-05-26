import { describe, it, expect, vi } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		const e = new Error(`redirect ${status} -> ${location}`) as Error & {
			status: number;
			location: string;
		};
		e.status = status;
		e.location = location;
		return e;
	}
}));

import { load } from './+layout';

function makeParent(userProfile: unknown, foodCategories: unknown[] = []) {
	return async () => ({ userProfile, foodCategories });
}

describe('(app) layout load — auth guard', () => {
	it('[OB-001] should redirect to /welcome when there is no user profile (first launch)', async () => {
		await expect(
			load({ parent: makeParent(null) } as unknown as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 307, location: '/welcome' });
	});

	it('[OB-003] should redirect to /welcome when a protected route is accessed without a profile', async () => {
		// Same guard applies regardless of which (app) child route triggers load.
		await expect(
			load({ parent: makeParent(undefined) } as unknown as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 307, location: '/welcome' });
	});

	it('[OB-004] should pass through user and food categories when authenticated (unprotected route behavior is upstream)', async () => {
		// /welcome and /setup live outside (app) so this loader does not run for them — proving they
		// are not guarded. When a user *is* present, this loader returns shared data without redirect.
		const categories = [{ shortvalue: 'l', longvalue: 'Lunch' }];
		const result = await load({
			parent: makeParent({ id: 1, name: 'Arnie' }, categories)
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({
			userProfile: { id: 1, name: 'Arnie' },
			foodCategories: categories
		});
	});
});
