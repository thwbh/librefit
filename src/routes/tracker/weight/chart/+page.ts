import { listWeightRange } from '$lib/api/tracker';
import { subWeeks } from 'date-fns';

export const load = async () => {
  const today = new Date();
  const listWeightResponse = await listWeightRange(subWeeks(today, 4), today);

  return {
    entries: listWeightResponse
  };
};
