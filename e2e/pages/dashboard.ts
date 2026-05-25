import type { Page } from '@playwright/test';

/**
 * Page object for the home dashboard (/).
 *
 * Source: src/routes/(app)/+page.svelte
 */
export class DashboardPage {
	constructor(private readonly page: Page) {}

	async goto(): Promise<void> {
		await this.page.goto('/');
	}

	get reviewPlanToggle() {
		return this.page.getByRole('button', { name: 'Review plan' });
	}

	get reviewPlanContent() {
		// Plan content rendered conditionally when expanded. Use a label that
		// only appears in the expanded section. The day counter ("Day X of Y")
		// is a stable marker.
		return this.page.getByText(/Day \d+ of \d+/);
	}
}
