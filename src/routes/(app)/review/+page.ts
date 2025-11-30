import {
	getBodyData,
	getLastWeightTarget,
	getLastWeightTracker,
	getLastIntakeTarget
} from '$lib/api/gen/commands';

export const ssr = false;

export async function load() {
	return {
		weightTarget: await getLastWeightTarget(),
		lastWeightTracker: await getLastWeightTracker(),
		intakeTarget: await getLastIntakeTarget(),
		bodyData: await getBodyData()
	};
}
