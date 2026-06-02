import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import WorkoutSummary from './WorkoutSummary.svelte';
import type { SessionSummary } from '$lib/workout/metrics';
import type { WorkoutExerciseView } from '$lib/api';

// Post-workout summary (WO-022): this-session totals + worked-muscle map + the
// per-exercise recap. Presentational — data is derived/captured upstream.
const summary: SessionSummary = {
	totalVolume: 1280,
	activeWorkTimeMs: 95_000, // 1:35
	setsCompleted: 6
};

function renderSummary(props: Record<string, unknown> = {}) {
	return render(WorkoutSummary, {
		props: { summary, ondismiss: vi.fn(), ...props }
	});
}

describe('WorkoutSummary', () => {
	it('shows this-session totals (volume, time, sets)', () => {
		renderSummary();
		expect(screen.getByText('1280 kg')).toBeInTheDocument();
		expect(screen.getByText('1:35')).toBeInTheDocument();
		expect(screen.getByText('6')).toBeInTheDocument();
		expect(screen.getByText('Workout complete')).toBeInTheDocument();
	});

	it('dismiss invokes ondismiss', async () => {
		const ondismiss = vi.fn();
		renderSummary({ ondismiss });
		await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
		expect(ondismiss).toHaveBeenCalledOnce();
	});

	it('renders the per-exercise recap with set counts and metrics', () => {
		const exercises = [
			{
				id: 1,
				exerciseId: 1,
				name: 'Back Squat',
				defaultRestSeconds: 180,
				sets: [
					{ id: 1, loggedAt: '2026-06-02T10:00:00.000Z', metrics: { reps: 8, weightKg: 100 } },
					{ id: 2, loggedAt: '2026-06-02T10:03:00.000Z', metrics: { reps: 8, weightKg: 100 } }
				]
			}
		] as unknown as WorkoutExerciseView[];

		renderSummary({ exercises });
		expect(screen.getByText('Back Squat')).toBeInTheDocument();
		expect(screen.getByText('2 sets')).toBeInTheDocument();
		expect(screen.getAllByText('8 × 100 kg')).toHaveLength(2);
	});

	it('omits the recap when there are no exercises', () => {
		renderSummary({ exercises: [] });
		expect(screen.queryByText(/sets?$/)).toBeNull();
	});
});
