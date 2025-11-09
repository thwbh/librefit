import { getTrackerProgress } from '$lib/api/gen';
import { getDateAsStr } from '$lib/date';
import type { PageLoad } from '../$types';

export const load: PageLoad = async () => {
  return {
    trackerProgress: await getTrackerProgress({ dateStr: getDateAsStr(new Date()) })
  };
};
