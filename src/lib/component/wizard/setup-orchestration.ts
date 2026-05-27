import type {
	LibreUser,
	NewIntakeTarget,
	NewWeightTarget,
	NewWeightTracker,
	WizardInput
} from '$lib/api';

export interface SetupPayload {
	userName: string;
	userAvatar: string;
	input: WizardInput;
	weightTracker: NewWeightTracker;
	weightTarget: NewWeightTarget;
	intakeTarget: NewIntakeTarget;
}

export interface SetupDeps {
	updateUser: (args: { userName: string; userAvatar: string }) => Promise<LibreUser | null>;
	updateBodyData: (args: {
		age: number;
		sex: WizardInput['sex'];
		height: number;
		weight: number;
		activityLevel: number;
	}) => Promise<unknown>;
	wizardCreateTargets: (args: {
		input: {
			weightTracker: NewWeightTracker;
			weightTarget: NewWeightTarget;
			intakeTarget: NewIntakeTarget;
		};
	}) => Promise<unknown>;
	onStepStart?: (step: SetupStep) => Promise<void> | void;
}

export type SetupStep = 'profile' | 'body' | 'targets';

export type SetupResult =
	| { ok: true; user: LibreUser | null; completedSteps: SetupStep[] }
	| { ok: false; failedAt: SetupStep; error: unknown; completedSteps: SetupStep[] };

export async function performSetup(payload: SetupPayload, deps: SetupDeps): Promise<SetupResult> {
	const completedSteps: SetupStep[] = [];
	let user: LibreUser | null = null;
	let currentStep: SetupStep = 'profile';

	try {
		currentStep = 'profile';
		await deps.onStepStart?.('profile');
		user = (await deps.updateUser({
			userName: payload.userName,
			userAvatar: payload.userAvatar
		})) as LibreUser | null;
		completedSteps.push('profile');

		currentStep = 'body';
		await deps.onStepStart?.('body');
		await deps.updateBodyData({
			age: payload.input.age,
			sex: payload.input.sex,
			height: payload.input.height,
			weight: payload.input.weight,
			activityLevel: payload.input.activityLevel
		});
		completedSteps.push('body');

		currentStep = 'targets';
		await deps.onStepStart?.('targets');
		await deps.wizardCreateTargets({
			input: {
				weightTracker: payload.weightTracker,
				weightTarget: payload.weightTarget,
				intakeTarget: payload.intakeTarget
			}
		});
		completedSteps.push('targets');

		return { ok: true, user, completedSteps };
	} catch (error) {
		return { ok: false, failedAt: currentStep, error, completedSteps };
	}
}
