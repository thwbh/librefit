import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import SetMask from './SetMask.svelte';

// Reps + weight entry. Submits validated `LiftingSetMetrics`; client validation
// mirrors the backend schema (the canonical bounds live in metrics.test.ts).
function numberInputs() {
	return Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
}

describe('SetMask', () => {
	it('prefills reps and weight from props', () => {
		render(SetMask, { props: { reps: 8, weightKg: 60, onsubmit: vi.fn() } });
		const [reps, weight] = numberInputs();
		expect(reps.value).toBe('8');
		expect(weight.value).toBe('60');
	});

	it('uses a custom submit label', () => {
		render(SetMask, { props: { submitLabel: 'Save', onsubmit: vi.fn() } });
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
	});

	it('submits the entered metrics', async () => {
		const onsubmit = vi.fn();
		render(SetMask, { props: { reps: 10, weightKg: 80, onsubmit } });
		await fireEvent.click(screen.getByRole('button', { name: 'Log set' }));
		expect(onsubmit).toHaveBeenCalledWith({ reps: 10, weightKg: 80 });
	});

	it('blocks submit and shows an error for invalid reps', async () => {
		const onsubmit = vi.fn();
		render(SetMask, { props: { reps: 8, weightKg: 60, onsubmit } });

		const [reps] = numberInputs();
		await fireEvent.input(reps, { target: { value: '0' } }); // below min (1)
		await fireEvent.click(screen.getByRole('button', { name: 'Log set' }));

		expect(onsubmit).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('clears the error once a valid value is submitted', async () => {
		const onsubmit = vi.fn();
		render(SetMask, { props: { reps: 8, weightKg: 60, onsubmit } });

		const [reps] = numberInputs();
		await fireEvent.input(reps, { target: { value: '0' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Log set' }));
		expect(screen.queryByRole('alert')).toBeInTheDocument();

		await fireEvent.input(reps, { target: { value: '5' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Log set' }));

		expect(onsubmit).toHaveBeenCalledWith({ reps: 5, weightKg: 60 });
		expect(screen.queryByRole('alert')).toBeNull();
	});
});
