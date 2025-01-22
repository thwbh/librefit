import { subDays } from 'date-fns';
import { listWeightRange } from '$lib/api/tracker';

export const load = async () => {
  const today = new Date();
  const fromDate = subDays(today, 6);

  return {
    weightWeekList: await listWeightRange(fromDate, today)
  };
};
