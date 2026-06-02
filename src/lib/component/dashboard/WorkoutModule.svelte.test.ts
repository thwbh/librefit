import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import WorkoutModule from './WorkoutModule.svelte';

// Presentational dashboard surface: idle "Start Workout" affordance vs the active
// promoted module (focus while working, recovery while resting). State is props;
// the layout-composition scenarios live in DashboardLayout.svelte.test.ts.
function renderModule(props: Record<string, unknown> = {}) {
	return render(WorkoutModule, {
		props: { active: false, onstart: vi.fn(), onopen: vi.fn(), ...props }
	});
}

describe('WorkoutModule', () => {
	it('idle: shows the Start Workout affordance and fires onstart', async () => {
		const onstart = vi.fn();
		renderModule({ active: false, onstart });
		const btn = screen.getByRole('button', { name: /Start Workout/i });
		expect(btn.className).toContain('border-dashed'); // distinct from the solid FAB
		await fireEvent.click(btn);
		expect(onstart).toHaveBeenCalledOnce();
	});

	it('active: shows current exercise + derived metrics and fires onopen', async () => {
		const onopen = vi.fn();
		const { container } = renderModule({
			active: true,
			currentExercise: 'Back Squat',
			activeWorkTimeMs: 95_000,
			totalVolume: 1200,
			setsCompleted: 5,
			onopen
		});

		expect(screen.getByText('Back Squat')).toBeInTheDocument();
		expect(screen.getByText('1:35')).toBeInTheDocument(); // 95s formatted
		expect(screen.getByText('1200 kg')).toBeInTheDocument();
		expect(screen.getByText('5 sets')).toBeInTheDocument();

		await fireEvent.click(container.querySelector('.workout-module--active')!);
		expect(onopen).toHaveBeenCalledOnce();
	});

	it('active with no exercise yet shows a placeholder', () => {
		renderModule({ active: true, currentExercise: null });
		expect(screen.getByText('No exercise yet')).toBeInTheDocument();
	});

	it('resting: focus → recovery visual, with the rest countdown', () => {
		const { container } = renderModule({
			active: true,
			resting: true,
			restRemainingMs: 65_000,
			currentExercise: 'Back Squat'
		});
		expect(container.querySelector('[data-visual="recovery"]')).not.toBeNull();
		expect(container.querySelector('[data-visual="focus"]')).toBeNull();
		expect(screen.getByText('Resting')).toBeInTheDocument();
		expect(screen.getByText('1:05')).toBeInTheDocument();
	});

	it('working (not resting) uses the focus visual', () => {
		const { container } = renderModule({ active: true, resting: false });
		expect(container.querySelector('[data-visual="focus"]')).not.toBeNull();
		expect(container.querySelector('[data-visual="recovery"]')).toBeNull();
	});
});
