import { getDashboard, getProfile } from '$lib/api/user';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		userProfile: await getProfile(),
		dashboardData: await getDashboard(new Date())
	};
};
