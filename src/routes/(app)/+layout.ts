import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

/**
 * App layout loader
 *
 * Requires authentication - redirects to /about if no user exists
 */
export const load: LayoutLoad = async ({ parent }) => {
	const { userProfile, foodCategories } = await parent();

	// Redirect to about/splash if no user exists
	if (!userProfile) {
		throw redirect(307, '/about');
	}

	return {
		userProfile,
		foodCategories
	};
};
