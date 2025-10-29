import { getUser, getFoodCategories } from '$lib/api/gen';
import type { LayoutLoad } from './$types';

export const ssr = false;

/**
 * Root layout loader
 *
 * Loads shared data once for the entire application:
 * - User profile: Optional, null if not yet created
 * - Food categories: Static reference data used throughout the app
 *
 * Note: Authentication checks are handled by individual route groups (e.g., (app)/+layout.ts)
 */
export const load: LayoutLoad = async () => {
	const userProfile = await getUser();
	const foodCategories = await getFoodCategories();

	return {
		userProfile,
		foodCategories
	};
};
