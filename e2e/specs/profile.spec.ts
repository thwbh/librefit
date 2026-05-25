import { test, expect } from '../fixtures/app';
import { ProfilePage } from '../pages/profile';

/**
 * Profile e2e tests.
 *
 * Spec: openspec/specs/profile/spec.md
 */

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}
function relativeRange(daysBefore: number, daysAfter: number) {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - daysBefore);
	const end = new Date(now);
	end.setDate(now.getDate() + daysAfter);
	return { startDate: ymd(start), endDate: ymd(end) };
}

test('[PF-001] profile page renders name, body data, and re-run wizard CTA', async ({
	page,
	seed
}) => {
	await seed.user({ name: 'Testuser' });
	await seed.bodyData({ age: 30, height: 175, weight: 75, sex: 'MALE', activityLevel: 1.5 });
	await seed.intakeTarget(relativeRange(30, 60));
	await seed.weightTarget(relativeRange(30, 60));

	const profile = new ProfilePage(page);
	await profile.goto();

	await expect(profile.nameHeading).toHaveText('Testuser');
	await expect(profile.swipeHint).toBeVisible();
	await expect(profile.bodyDataField('Biological Sex')).toBeVisible();
	await expect(profile.bodyDataField('Age')).toBeVisible();
	await expect(profile.bodyDataField('Height')).toBeVisible();
	await expect(profile.bodyDataField('Starting Weight')).toBeVisible();
	await expect(profile.rerunWizardButton).toBeVisible();
});

test.describe('Profile edit (swipe-driven)', () => {
	// [PF-002] Swipe to edit opens modal
	// [PF-003] Save profile changes
	// [PF-004] Cancel discards changes
	test.skip('[PF-002] [PF-003] [PF-004] [GES-003] swipe-left opens edit, save persists, cancel discards', async () => {
		// TODO: Playwright lacks native swipe-gesture support. Implement via
		// page.mouse drag (down → move → up) or dispatchEvent for touchstart/
		// touchmove/touchend. The SwipeableListItem in ProfileHeader.svelte
		// uses svelte-gestures; check whether it listens for mouse or touch.
	});
});

test.describe('Avatar picker (swipe-driven)', () => {
	// [PF-005] Picker offers eight options
	// [PF-006] Swipe left randomizes avatar
	// [PF-007] Swipe right resets avatar
	test.skip('[PF-005] [PF-006] [PF-007] avatar picker semantics', async () => {
		// TODO: requires PF-002 swipe gesture to first open the edit modal,
		// then tap avatar to open picker. Implement once gesture helpers exist.
	});
});

test.describe('Wizard re-run', () => {
	// [PF-014] Wizard re-run preloads body data
	// [PF-015] New targets after wizard
	test.skip('[PF-014] [PF-015] re-run wizard creates new targets', async () => {
		// TODO: click the Re-run Setup Wizard button, complete the wizard
		// with modified inputs, assert new targets exist in addition to the
		// old ones (use seed primitives to verify, or read via existing
		// Tauri commands like get_last_intake_target).
	});
});
