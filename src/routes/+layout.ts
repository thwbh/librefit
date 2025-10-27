import { getUser, getFoodCategories } from '$lib/api/gen';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const ssr = false;

/**
 * Root layout loader
 *
 * Loads shared data once for the entire application:
 * - User profile: Required for all authenticated routes
 * - Food categories: Static reference data used throughout the app
 */
export const load: LayoutLoad = async () => {
  const userProfile = await getUser();

  // Redirect to about/splash if no user exists
  if (!userProfile) {
    throw redirect(307, '/about');
  }

  const foodCategories = await getFoodCategories();

  return {
    userProfile,
    foodCategories
  };
};
