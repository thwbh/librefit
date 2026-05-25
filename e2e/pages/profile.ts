import type { Page } from '@playwright/test';

/**
 * Page object for /profile.
 * Source: src/routes/(app)/profile/+page.svelte, src/lib/component/profile/*
 */
export class ProfilePage {
	constructor(private readonly page: Page) {}

	async goto(): Promise<void> {
		await this.page.goto('/profile');
	}

	get nameHeading() {
		return this.page.getByRole('heading', { level: 2 });
	}

	get swipeHint() {
		return this.page.getByText(/swipe to edit/i);
	}

	get rerunWizardButton() {
		return this.page.getByRole('button', { name: 'Re-run Setup Wizard' });
	}

	bodyDataField(label: 'Biological Sex' | 'Age' | 'Height' | 'Starting Weight') {
		// Each row renders "<label>" as a small caption above its value.
		return this.page.getByText(label, { exact: true });
	}
}
