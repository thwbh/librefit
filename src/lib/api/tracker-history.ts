import { getDateAsStr } from '$lib/date';
import type { TrackerHistory } from '$lib/model';
import { invoke } from '@tauri-apps/api/core';

export const getTrackerHistory = (dateFrom: Date, dateTo: Date): Promise<TrackerHistory> => {
	return invoke('get_tracker_history', {
		dateFromStr: getDateAsStr(dateFrom),
		dateToStr: getDateAsStr(dateTo)
	});
};
