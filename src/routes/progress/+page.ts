import { getTrackerProgress } from '$lib/api/progress';
import type { PageLoad } from '../$types';

export const load: PageLoad = async () => {
	return {
		trackerProgress: await getTrackerProgress(new Date())
	};
};
