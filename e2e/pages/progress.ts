import type { Page } from '@playwright/test';

/**
 * Page object for /progress.
 * Source: src/routes/(app)/progress/+page.svelte
 */
export class ProgressPage {
	constructor(private readonly page: Page) {}

	async goto(): Promise<void> {
		await this.page.goto('/progress');
	}

	get dayCounter() {
		return this.page.getByText(/Day \d+ of \d+/);
	}

	get insufficientDataMessage() {
		return this.page.getByText('Not enough data yet');
	}

	get chartCanvases() {
		// Chart.js renders to <canvas> elements.
		return this.page.locator('canvas');
	}
}
