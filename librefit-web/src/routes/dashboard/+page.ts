import { getDateAsStr } from '$lib/date';
import { invoke } from '@tauri-apps/api/core';
import type { LoadEvent } from '@sveltejs/kit';
import type { Dashboard } from '$lib/model';

export const load = async ({ fetch }: LoadEvent): Promise<{ dashboardData: Dashboard }> => {
	const today = new Date();

	const dashboard: Promise<Dashboard> = invoke('daily_dashboard', { dateStr: getDateAsStr(today) });

	return {
		dashboardData: await dashboard
	};
};
