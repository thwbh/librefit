import { getBodyData } from '$lib/api/gen';
import type { PageLoad } from './$types';

/**
 * Profile page loader
 *
 * User profile is loaded at layout level and available via parent().
  */
export const load: PageLoad = async ({ parent }) => {
  // Wait for layout data to be available
  await parent();

  return {
    bodyData: await getBodyData()
  };
};
