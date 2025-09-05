import { getDateAsStr } from '$lib/date';
import type { TrackerProgress } from '$lib/model';
import { invoke } from '@tauri-apps/api/core';

export const getTrackerProgress = (date: Date): Promise<TrackerProgress> => {
	return invoke('get_tracker_progress', { dateStr: getDateAsStr(date) });
};
