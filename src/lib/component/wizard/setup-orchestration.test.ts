import { describe, it, expect, vi } from 'vitest';
import { performSetup, type SetupPayload, type SetupDeps } from './setup-orchestration';

function makePayload(overrides: Partial<SetupPayload> = {}): SetupPayload {
	return {
		userName: 'Alice',
		userAvatar: 'avatar-seed',
		input: {
			age: 30,
			sex: 'FEMALE' as never,
			weight: 70,
			height: 170,
			activityLevel: 1,
			weeklyDifference: 1,
			calculationGoal: 'LOSS' as never
		},
		weightTracker: { added: '2026-05-27', amount: 70 } as never,
		weightTarget: { id: 0 } as never,
		intakeTarget: { id: 0 } as never,
		...overrides
	};
}

function makeDeps(overrides: Partial<SetupDeps> = {}): SetupDeps {
	return {
		updateUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice', avatar: 'avatar-seed' }),
		updateBodyData: vi.fn().mockResolvedValue(undefined),
		wizardCreateTargets: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}

describe('performSetup', () => {
	it('[OB-015] happy path runs profile → body → targets in order and returns ok', async () => {
		const callOrder: string[] = [];
		const deps = makeDeps({
			updateUser: vi.fn(async () => {
				callOrder.push('profile');
				return { id: 1, name: 'Alice', avatar: 'avatar-seed' };
			}),
			updateBodyData: vi.fn(async () => {
				callOrder.push('body');
			}),
			wizardCreateTargets: vi.fn(async () => {
				callOrder.push('targets');
			})
		});

		const result = await performSetup(makePayload(), deps);

		expect(result.ok).toBe(true);
		expect(callOrder).toEqual(['profile', 'body', 'targets']);
		if (result.ok) {
			expect(result.completedSteps).toEqual(['profile', 'body', 'targets']);
			expect(result.user).toEqual({ id: 1, name: 'Alice', avatar: 'avatar-seed' });
		}
	});

	it('[OB-016] rollback path: when wizardCreateTargets throws, returns failedAt=targets with profile+body completed', async () => {
		const deps = makeDeps({
			wizardCreateTargets: vi.fn().mockRejectedValue(new Error('db boom'))
		});

		const result = await performSetup(makePayload(), deps);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.failedAt).toBe('targets');
			expect(result.completedSteps).toEqual(['profile', 'body']);
			expect(result.error).toBeInstanceOf(Error);
		}
	});

	it('[OB-016] failure at body step short-circuits targets', async () => {
		const targets = vi.fn();
		const deps = makeDeps({
			updateBodyData: vi.fn().mockRejectedValue(new Error('body boom')),
			wizardCreateTargets: targets
		});

		const result = await performSetup(makePayload(), deps);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.failedAt).toBe('body');
			expect(result.completedSteps).toEqual(['profile']);
		}
		expect(targets).not.toHaveBeenCalled();
	});

	it('[OB-016] failure at profile step does not call body or targets', async () => {
		const body = vi.fn();
		const targets = vi.fn();
		const deps = makeDeps({
			updateUser: vi.fn().mockRejectedValue(new Error('profile boom')),
			updateBodyData: body,
			wizardCreateTargets: targets
		});

		const result = await performSetup(makePayload(), deps);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.failedAt).toBe('profile');
			expect(result.completedSteps).toEqual([]);
		}
		expect(body).not.toHaveBeenCalled();
		expect(targets).not.toHaveBeenCalled();
	});

	it('[OB-017] wizardCreateTargets is called exactly once with all three records', async () => {
		const payload = makePayload();
		const deps = makeDeps();

		await performSetup(payload, deps);

		expect(deps.wizardCreateTargets).toHaveBeenCalledTimes(1);
		expect(deps.wizardCreateTargets).toHaveBeenCalledWith({
			input: {
				weightTracker: payload.weightTracker,
				weightTarget: payload.weightTarget,
				intakeTarget: payload.intakeTarget
			}
		});
	});

	it('[PF-015] wizard re-run: each call to performSetup creates new targets independently', async () => {
		const deps = makeDeps();

		const firstRun = makePayload({
			weightTarget: { id: 0, addedDate: '2026-05-01' } as never,
			intakeTarget: { id: 0, addedDate: '2026-05-01' } as never
		});
		const secondRun = makePayload({
			weightTarget: { id: 0, addedDate: '2026-05-27' } as never,
			intakeTarget: { id: 0, addedDate: '2026-05-27' } as never
		});

		await performSetup(firstRun, deps);
		await performSetup(secondRun, deps);

		expect(deps.wizardCreateTargets).toHaveBeenCalledTimes(2);
		expect(deps.wizardCreateTargets).toHaveBeenNthCalledWith(1, {
			input: {
				weightTracker: firstRun.weightTracker,
				weightTarget: firstRun.weightTarget,
				intakeTarget: firstRun.intakeTarget
			}
		});
		expect(deps.wizardCreateTargets).toHaveBeenNthCalledWith(2, {
			input: {
				weightTracker: secondRun.weightTracker,
				weightTarget: secondRun.weightTarget,
				intakeTarget: secondRun.intakeTarget
			}
		});
	});

	it('onStepStart is invoked before each Tauri call in order', async () => {
		const events: string[] = [];
		const deps = makeDeps({
			updateUser: vi.fn(async () => {
				events.push('updateUser');
				return null;
			}),
			updateBodyData: vi.fn(async () => {
				events.push('updateBodyData');
			}),
			wizardCreateTargets: vi.fn(async () => {
				events.push('wizardCreateTargets');
			}),
			onStepStart: (step) => {
				events.push(`onStepStart:${step}`);
			}
		});

		await performSetup(makePayload(), deps);

		expect(events).toEqual([
			'onStepStart:profile',
			'updateUser',
			'onStepStart:body',
			'updateBodyData',
			'onStepStart:targets',
			'wizardCreateTargets'
		]);
	});
});
