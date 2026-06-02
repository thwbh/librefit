import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SlideToConfirm from './SlideToConfirm.svelte';

// The gesture confirms only on a completed slide past the threshold; a tap or a
// partial slide does nothing, and crossing the threshold fires a haptic pulse.
//
// jsdom's PointerEvent doesn't carry clientX, so we dispatch MouseEvents under
// the pointer* type names (the listeners fire on type, and MouseEvent does carry
// clientX) to drive real drag distances.
const ptr = (type: string, clientX?: number) => new MouseEvent(type, { clientX, bubbles: true });

describe('SlideToConfirm', () => {
	beforeEach(() => {
		Object.defineProperty(navigator, 'vibrate', {
			configurable: true,
			writable: true,
			value: vi.fn()
		});
	});

	it('[WO-023] [WO-024] a tap does not confirm', async () => {
		const onconfirm = vi.fn();
		const { getByRole } = render(SlideToConfirm, {
			props: { label: 'Slide to end', distance: 100, onconfirm }
		});
		const track = getByRole('button', { name: 'Slide to end' });
		await fireEvent(track, ptr('pointerdown', 40));
		await fireEvent(track, ptr('pointerup', 40));
		expect(onconfirm).not.toHaveBeenCalled();
	});

	it('[WO-023] [WO-024] a partial slide does not confirm', async () => {
		const onconfirm = vi.fn();
		const { getByRole } = render(SlideToConfirm, {
			props: { label: 'Slide to discard', distance: 100, onconfirm }
		});
		const track = getByRole('button', { name: 'Slide to discard' });
		await fireEvent(track, ptr('pointerdown', 0));
		await fireEvent(track, ptr('pointermove', 50)); // half-way
		await fireEvent(track, ptr('pointerup', 50));
		expect(onconfirm).not.toHaveBeenCalled();
	});

	it('[WO-023] [WO-024] completing the slide confirms and fires a threshold haptic', async () => {
		const onconfirm = vi.fn();
		const { getByRole } = render(SlideToConfirm, {
			props: { label: 'Slide to end', distance: 100, onconfirm }
		});
		const track = getByRole('button', { name: 'Slide to end' });
		await fireEvent(track, ptr('pointerdown', 0));
		await fireEvent(track, ptr('pointermove', 120)); // past threshold
		expect(navigator.vibrate).toHaveBeenCalled(); // haptic at the threshold
		await fireEvent(track, ptr('pointerup', 120));
		expect(onconfirm).toHaveBeenCalledTimes(1);
	});
});
