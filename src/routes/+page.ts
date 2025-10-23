import { dailyDashboard, getUser } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { info } from '@tauri-apps/plugin-log';

export const load: PageLoad = async () => {
  const userProfile = await getUser();

  if (!userProfile) {
    info('No user profile found, redirecting to splash screen.');

    throw redirect(307, '/about');
  }


  return {
    userProfile: await getUser(),
    dashboardData: await dailyDashboard({ dateStr: getDateAsStr(new Date()) })
  };
};
