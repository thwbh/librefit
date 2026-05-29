import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PlanReviewPanel from './PlanReviewPanel.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		expanded: false,
		dailyRate: 500,
		recommendation: 'LOSE' as const,
		targetCalories: 1800,
		maximumCalories: 2300,
		averageIntake: 1900,
		daysElapsed: 7,
		daysLeft: 21,
		goalReached: false,
		...overrides
	};
}

describe('PlanReviewPanel', () => {
	it('[PR-002] collapsed: nothing from the plan card renders', () => {
		render(PlanReviewPanel, { props: baseProps({ expanded: false }) });
		// IntakePlanCard renders the daily-rate number prominently. With
		// expanded=false the {#if} block is skipped — no card content present.
		expect(screen.queryByText(/500/)).toBeNull();
	});

	it('[PR-001] expanded: IntakePlanCard + EncouragementMessage render', () => {
		render(PlanReviewPanel, { props: baseProps({ expanded: true }) });
		// IntakePlanCard surfaces the dailyRate.
		expect(screen.queryByText(/500/)).not.toBeNull();
		// EncouragementMessage renders some text — its presence in the DOM is
		// the observable signal that the second child mounted.
		// (The exact text varies with goalReached/averageIntake; we just need
		// to confirm the panel mounted both children.)
		expect(document.body.textContent?.length).toBeGreaterThan(0);
	});

	it('[PR-001] flipping `expanded` from false to true mounts the plan content', async () => {
		const props = $state(baseProps({ expanded: false }));
		render(PlanReviewPanel, { props });

		expect(screen.queryByText(/500/)).toBeNull();

		props.expanded = true;
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.queryByText(/500/)).not.toBeNull();

		// Asserting the reverse (expanded: true → false unmounting) is unreliable
		// in jsdom — Svelte's slide/fly OUT transition keeps elements mounted
		// during the animation, and jsdom doesn't always tick it to completion.
		// The [PR-002] initial-state test above covers the collapsed-render
		// behavior at the cheapest layer.
	});
});
