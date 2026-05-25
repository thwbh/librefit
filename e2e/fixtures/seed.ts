import type { Page } from '@playwright/test';

/**
 * Composable seed helpers for e2e tests.
 *
 * Each helper invokes a Tauri command from the `e2e-seed` feature in the Rust
 * crate (see src-tauri/src/cmd/seed.rs). The binary under test MUST be built
 * with `cargo tauri build --debug --features e2e-seed`.
 *
 * Dates are REQUIRED arguments where they appear. Tests must supply fixed
 * dates rather than relying on a notion of "today" inside the seed layer.
 * Times default to fixed constants (12:00:00, 08:00:00) — times-of-day do not
 * drift and are safe to default.
 */

async function invoke<T>(page: Page, command: string, args: object = {}): Promise<T> {
	return page.evaluate(
		({ command, args }) =>
			(
				window as unknown as {
					__TAURI_INTERNALS__: { invoke: (c: string, a: object) => Promise<unknown> };
				}
			).__TAURI_INTERNALS__.invoke(command, args) as Promise<unknown>,
		{ command, args }
	) as Promise<T>;
}

export interface SeedHelpers {
	user(opts?: { name?: string; avatar?: string }): Promise<unknown>;
	bodyData(opts?: {
		age?: number;
		height?: number;
		weight?: number;
		sex?: string;
		activityLevel?: number;
	}): Promise<unknown>;
	intakeTarget(args: {
		startDate: string;
		endDate: string;
		targetCalories?: number;
		maximumCalories?: number;
	}): Promise<unknown>;
	weightTarget(args: {
		startDate: string;
		endDate: string;
		initialWeight?: number;
		targetWeight?: number;
	}): Promise<unknown>;
	intakeEntry(args: {
		date: string;
		amount: number;
		category?: string;
		time?: string;
		description?: string;
	}): Promise<unknown>;
	weightEntry(args: { date: string; weight: number; time?: string }): Promise<unknown>;

	/** Convenience: minimal profile sufficient to access (app) routes. */
	defaultProfile(args: { startDate: string; endDate: string }): Promise<void>;
}

export function makeSeedHelpers(page: Page): SeedHelpers {
	return {
		user: (opts = {}) => invoke(page, 'seed_user', opts),
		bodyData: (opts = {}) => invoke(page, 'seed_body_data', opts),
		intakeTarget: (args) => invoke(page, 'seed_intake_target', args),
		weightTarget: (args) => invoke(page, 'seed_weight_target', args),
		intakeEntry: (args) => invoke(page, 'seed_intake_entry', args),
		weightEntry: (args) => invoke(page, 'seed_weight_entry', args),

		defaultProfile: async ({ startDate, endDate }) => {
			await invoke(page, 'seed_user', {});
			await invoke(page, 'seed_body_data', {});
			await invoke(page, 'seed_intake_target', { startDate, endDate });
			await invoke(page, 'seed_weight_target', { startDate, endDate });
			await invoke(page, 'seed_weight_entry', { date: startDate, weight: 75.0 });
		}
	};
}
