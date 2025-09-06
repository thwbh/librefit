import { dailyDashboard, getUser } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  return {
    userProfile: await getUser(),
    dashboardData: await dailyDashboard({ dateStr: getDateAsStr(new Date()) })
  };
};
