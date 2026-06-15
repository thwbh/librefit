import { render, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect } from 'vitest';
import AvatarMaintenanceIndicator from './AvatarMaintenanceIndicator.svelte';
import type { UnverifiedSummary } from '$lib/api';

// Dashboard avatar maintenance indicator (DH-019..DH-022). Pure presentation over the
// `workout-tracking` unverified summary — count, graceful decay, clear-when-empty, and
// the tap that opens the quick-fix.
const SRC = 'data:image/png;base64,AAAA';
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

describe('AvatarMaintenanceIndicator', () => {
	it('[DH-019] shows the unverified count on the avatar', async () => {
		const summary: UnverifiedSummary = { count: 3, oldestCreatedAt: hoursAgo(2) };
		render(AvatarMaintenanceIndicator, { props: { avatarSrc: SRC, summary, onopen: vi.fn() } });

		expect(screen.getByTestId('maintenance-indicator')).toBeInTheDocument();
		expect(screen.getByTestId('maintenance-count')).toHaveTextContent('3');
	});

	it('[DH-019] renders prominent while the unverified exercises are recent', async () => {
		const summary: UnverifiedSummary = { count: 1, oldestCreatedAt: hoursAgo(2) };
		render(AvatarMaintenanceIndicator, { props: { avatarSrc: SRC, summary, onopen: vi.fn() } });

		expect(screen.getByTestId('maintenance-indicator')).toHaveAttribute('data-decayed', 'false');
		expect(screen.getByTestId('maintenance-count')).toHaveClass('badge-error');
	});

	it('[DH-020] decays once the unverified exercises age past the recency window', async () => {
		const summary: UnverifiedSummary = { count: 1, oldestCreatedAt: hoursAgo(72) };
		render(AvatarMaintenanceIndicator, { props: { avatarSrc: SRC, summary, onopen: vi.fn() } });

		expect(screen.getByTestId('maintenance-indicator')).toHaveAttribute('data-decayed', 'true');
		expect(screen.getByTestId('maintenance-count')).toHaveClass('badge-neutral');
	});

	it('[DH-021] clears the indicator when nothing is unverified', async () => {
		const summary: UnverifiedSummary = { count: 0 };
		render(AvatarMaintenanceIndicator, { props: { avatarSrc: SRC, summary, onopen: vi.fn() } });

		expect(screen.queryByTestId('maintenance-indicator')).not.toBeInTheDocument();
	});

	it('[DH-022] opens the quick-fix when tapped', async () => {
		const onopen = vi.fn();
		const summary: UnverifiedSummary = { count: 2, oldestCreatedAt: hoursAgo(1) };
		render(AvatarMaintenanceIndicator, { props: { avatarSrc: SRC, summary, onopen } });

		await fireEvent.click(screen.getByTestId('maintenance-indicator'));
		expect(onopen).toHaveBeenCalled();
	});
});
