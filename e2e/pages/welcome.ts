import type { Page } from '@playwright/test';

/**
 * Page object for the welcome screen (/welcome).
 *
 * Source: src/routes/welcome/+page.svelte
 *
 * Specs covered (via tests citing the IDs):
 *   - openspec/specs/onboarding/spec.md  — OB-001, OB-002
 *   - openspec/specs/_conv-animations/spec.md — ANI-001 (fade/fly entrance)
 */
export class WelcomePage {
	constructor(private readonly page: Page) {}

	get logo() {
		// <img alt="LibreFit" />
		return this.page.getByAltText('LibreFit');
	}

	get tagline() {
		return this.page.getByText('Track smarter. Live healthier.');
	}

	get privacyBadge() {
		return this.page.getByText('Your data stays on your device');
	}

	get featureCards() {
		return [
			this.page.getByText('Personalized calorie goals'),
			this.page.getByText('Beautiful progress tracking'),
			this.page.getByText('Simple daily tracking')
		];
	}

	get versionLine() {
		// Format: "Version X.Y.Z • Free & Open Source"
		return this.page.getByText(/Version .+ • Free & Open Source/);
	}

	get getStartedButton() {
		return this.page.getByRole('button', { name: 'Get Started' });
	}

	async clickGetStarted(): Promise<void> {
		await this.getStartedButton.click();
	}
}
