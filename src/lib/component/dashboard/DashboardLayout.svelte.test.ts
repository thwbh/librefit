import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import DashboardLayout from './DashboardLayout.svelte';

// Cross-feature composition + the Idle↔Active morph (the `dashboard` capability).
// The feature cards are passed as snippets; we stub them with identifiable text.
function card(text: string) {
	return createRawSnippet(() => ({
		render: () => `<div data-testid="${text}-card">${text}</div>`
	}));
}

function renderLayout(props: Record<string, unknown> = {}) {
	return render(DashboardLayout, {
		props: {
			active: false,
			calorieValue: 0.5,
			weightValue: 0.5,
			calorieCard: card('calorie'),
			weightCard: card('weight'),
			onStart: vi.fn(),
			onOpen: vi.fn(),
			...props
		}
	});
}

describe('DashboardLayout', () => {
	it('[DH-001] [DH-006] idle: calorie card, weight card, then Start Workout, in order', () => {
		const { container } = renderLayout({ active: false });
		expect(container.querySelector('[data-state="idle"]')).not.toBeNull();
		const text = container.textContent ?? '';
		const cal = text.indexOf('calorie');
		const wt = text.indexOf('weight');
		const start = text.indexOf('Start Workout');
		expect(cal).toBeGreaterThanOrEqual(0);
		expect(cal).toBeLessThan(wt);
		expect(wt).toBeLessThan(start);
	});

	it('[DH-002] [DH-005] active: workout module promoted to the top, cards collapsed', () => {
		const { container } = renderLayout({ active: true });
		expect(container.querySelector('[data-state="active"]')).not.toBeNull();
		// Promoted module rendered in the active (focus) palette.
		const module = container.querySelector('[data-visual="focus"]');
		expect(module).not.toBeNull();
		// It appears before the collapsed calorie row.
		const calRow = screen.getByLabelText('Expand Calories');
		expect(module!.compareDocumentPosition(calRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('[DH-003] active: calorie and weight cards collapse to micro-progress rows', () => {
		renderLayout({ active: true });
		// Micro rows present, full cards hidden.
		expect(screen.getByLabelText('Expand Calories')).toBeTruthy();
		expect(screen.getByLabelText('Expand Weight')).toBeTruthy();
		expect(screen.queryByTestId('calorie-card')).toBeNull();
		expect(document.querySelector('progress')).not.toBeNull();
	});

	it('[DH-004] tapping a collapsed row expands it to the full card, then collapses', async () => {
		renderLayout({ active: true });
		expect(screen.queryByTestId('calorie-card')).toBeNull();
		await fireEvent.click(screen.getByLabelText('Expand Calories'));
		expect(screen.getByTestId('calorie-card')).toBeTruthy();
		await fireEvent.click(screen.getByText('Collapse'));
		expect(screen.queryByTestId('calorie-card')).toBeNull();
	});

	it('[DH-007] resting shows the recovery visual', () => {
		const { container } = renderLayout({ active: true, resting: true });
		expect(container.querySelector('[data-visual="recovery"]')).not.toBeNull();
		expect(container.querySelector('[data-visual="focus"]')).toBeNull();
	});

	it('[DH-008] working (not resting) shows the focus visual', () => {
		const { container } = renderLayout({ active: true, resting: false });
		expect(container.querySelector('[data-visual="focus"]')).not.toBeNull();
		expect(container.querySelector('[data-visual="recovery"]')).toBeNull();
	});

	it('[DH-011] idle with completed workouts shows the cards surface above Start Workout', () => {
		const { container } = renderLayout({
			active: false,
			showWorkoutCards: true,
			workoutCards: card('today-workout')
		});
		const text = container.textContent ?? '';
		// Cards appear, and the Start Workout module remains so another can be started.
		expect(text).toContain('today-workout');
		expect(text).toContain('Start Workout');
		expect(text.indexOf('today-workout')).toBeLessThan(text.indexOf('Start Workout'));
	});

	it('[DH-012] idle with no completed workouts shows the Start Workout module', () => {
		const { container } = renderLayout({ active: false, showWorkoutCards: false });
		expect(container.textContent ?? '').toContain('Start Workout');
	});

	it('[DH-016] active session hides the completed-workout cards', () => {
		const { container } = renderLayout({
			active: true,
			showWorkoutCards: true,
			workoutCards: card('today-workout')
		});
		// The idle workout surface (and its cards) is not rendered while active.
		expect(container.textContent ?? '').not.toContain('today-workout');
	});
});
