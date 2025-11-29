import { getLastWeightTarget, getLastWeightTracker } from '$lib/api/gen/commands';

export const ssr = false;

export async function load() {
	return {
		weightTarget: await getLastWeightTarget(),
		lastWeightTracker: await getLastWeightTracker()
	};
}
