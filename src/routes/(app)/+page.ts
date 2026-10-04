import { dailyDashboard, getAiIntakeConfig } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';
import type { PageLoad } from './$types';

/**
 * Dashboard page loader
 *
 * User profile is loaded at layout level and available via parent().
 * This loader only fetches dashboard-specific data.
 *
 * The AI-intake status is preloaded here so the camera FAB renders with the
 * correct affordance on first paint (no post-mount flicker). A failure to read it
 * must not block the dashboard, so it falls back to null (feature hidden).
 */
export const load: PageLoad = async ({ depends }) => {
	depends('data:dashboardData');

	const [dashboardData, aiStatus] = await Promise.all([
		dailyDashboard({ dateStr: getDateAsStr(new Date()) }),
		getAiIntakeConfig().catch(() => null)
	]);

	return { dashboardData, aiStatus };
};
