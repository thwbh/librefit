import { getDashboard } from '$lib/api/user';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		dashboardData: await getDashboard(new Date())
	};
};
