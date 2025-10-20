import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import WeightScore from '../../../src/lib/component/weight/WeightScore.svelte';
import type { WeightTarget, WeightTracker, NewWeightTracker } from '$lib/api/gen';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('@number-flow/svelte', () => ({
	default: vi.fn(({ value }) => `<span data-testid="number-flow">${value}</span>`)
}));

vi.mock('@thwbh/veilchen', () => ({
	ModalDialog: vi.fn(() => null),
	ValidatedInput: vi.fn(() => null)
}));

vi.mock('$lib/date', () => ({
	display_date_format: 'DD.MM.YYYY',
	getDateAsStr: vi.fn(() => '2023-01-15'),
	parseStringAsDate: vi.fn((dateStr: string) => new Date(dateStr))
}));

describe('WeightScore Component', () => {
	const mockWeightTarget: WeightTarget = {
		id: 1,
		added: '2023-01-01',
		endDate: '2023-06-01',
		initialWeight: 80,
		startDate: '2023-01-01',
		targetWeight: 70
	};

	const mockWeightTracker: WeightTracker = {
		id: 1,
		added: '2023-01-15',
		amount: 75
	};

	const mockLastWeightTracker: WeightTracker = {
		id: 1,
		added: '2023-01-10',
		amount: 76
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render component with weight tracker', () => {
		const { container } = render(WeightScore, {
			props: {
				weightTracker: mockWeightTracker,
				weightTarget: mockWeightTarget
			}
		});

		expect(container).toBeInTheDocument();
		expect(screen.getByText('kg')).toBeInTheDocument();
	});

	it('should render component without weight tracker', () => {
		const { container } = render(WeightScore, {
			props: {
				weightTarget: mockWeightTarget
			}
		});

		expect(container).toBeInTheDocument();
		expect(screen.getByText('-')).toBeInTheDocument();
	});

	it('should display current weight title', () => {
		render(WeightScore, {
			props: {
				weightTracker: mockWeightTracker,
				weightTarget: mockWeightTarget
			}
		});

		expect(screen.getByText('Current Weight')).toBeInTheDocument();
	});

	it('should have Review plan button', () => {
		render(WeightScore, {
			props: {
				weightTracker: mockWeightTracker,
				weightTarget: mockWeightTarget
			}
		});

		expect(screen.getByText('Review plan')).toBeInTheDocument();
	});

	it('should have Set Weight button', () => {
		render(WeightScore, {
			props: {
				weightTarget: mockWeightTarget
			}
		});

		const addButton = screen.getByLabelText('Set Weight');
		expect(addButton).toBeInTheDocument();
	});

	it('should handle different weight tracker states', () => {
		const { container } = render(WeightScore, {
			props: {
				lastWeightTracker: mockLastWeightTracker,
				weightTarget: mockWeightTarget
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should show days left information', () => {
		render(WeightScore, {
			props: {
				weightTracker: mockWeightTracker,
				weightTarget: mockWeightTarget
			}
		});

		expect(screen.getByText(/days left/)).toBeInTheDocument();
	});
});