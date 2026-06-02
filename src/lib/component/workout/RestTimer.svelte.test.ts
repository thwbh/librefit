import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import RestTimer from './RestTimer.svelte';

// Presentational countdown: it only renders the remaining time it is given and
// exposes a dismiss; the value is derived upstream (see metrics.test.ts WO-017/018).
describe('RestTimer', () => {
	it('renders remaining time as m:ss while counting down', () => {
		render(RestTimer, { props: { remainingMs: 95_000, ondismiss: vi.fn() } });
		// 95s → 1:35, with seconds rounded up (ceil).
		expect(screen.getByText('1:35')).toBeInTheDocument();
		expect(screen.getByRole('timer')).toBeInTheDocument();
	});

	it('zero-pads the seconds', () => {
		render(RestTimer, { props: { remainingMs: 65_000, ondismiss: vi.fn() } });
		expect(screen.getByText('1:05')).toBeInTheDocument();
	});

	it('rounds partial seconds up', () => {
		render(RestTimer, { props: { remainingMs: 4200, ondismiss: vi.fn() } });
		expect(screen.getByText('0:05')).toBeInTheDocument();
	});

	it('dismiss button invokes ondismiss', async () => {
		const ondismiss = vi.fn();
		render(RestTimer, { props: { remainingMs: 30_000, ondismiss } });
		await fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
		expect(ondismiss).toHaveBeenCalledOnce();
	});

	it('renders nothing once the countdown reaches zero', () => {
		const { container } = render(RestTimer, { props: { remainingMs: 0, ondismiss: vi.fn() } });
		expect(container.querySelector('.rest-timer')).toBeNull();
	});
});
