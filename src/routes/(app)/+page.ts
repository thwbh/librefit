import { dailyDashboard } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';
import type { PageLoad } from './$types';

/**
 * Dashboard page loader
 *
 * User profile is loaded at layout level and available via parent().
 * This loader only fetches dashboard-specific data.
 */
export const load: PageLoad = async ({ depends }) => {

  depends('data:dashboardData');

  return {
    dashboardData: await dailyDashboard({ dateStr: getDateAsStr(new Date()) })
  };
};
