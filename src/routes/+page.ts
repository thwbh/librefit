import { getDashboard } from '$lib/api/user.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		dashboardData: await getDashboard(new Date())
	};
};
