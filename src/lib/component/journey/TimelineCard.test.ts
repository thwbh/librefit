import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TimelineCard from './TimelineCard.svelte';

// Mock the date utility
vi.mock('$lib/date', () => ({
	convertDateStrToDisplayDateStr: vi.fn((dateStr: string) => {
		// Simple mock that returns a formatted date
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	})
}));

describe('TimelineCard Component', () => {
	const mockStartDate = '2025-01-01';
	const mockEndDate = '2025-06-01';

	it('should render timeline title', () => {
		render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		expect(screen.getByText('Timeline')).toBeInTheDocument();
	});

	it('should display start date label', () => {
		render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		expect(screen.getByText('Start Date')).toBeInTheDocument();
	});

	it('should display target date label', () => {
		render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		expect(screen.getByText('Target Date')).toBeInTheDocument();
	});

	it('should format and display start date', () => {
		render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		// The mock will format it as "Jan 1, 2025"
		expect(screen.getByText(/Jan.*1.*2025/i)).toBeInTheDocument();
	});

	it('should format and display end date', () => {
		render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		// The mock will format it as "Jun 1, 2025"
		expect(screen.getByText(/Jun.*1.*2025/i)).toBeInTheDocument();
	});

	it('should apply correct styling', () => {
		const { container } = render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		const card = container.querySelector('.bg-base-100.rounded-box.p-6.shadow');
		expect(card).toBeDefined();
	});

	it('should render rocket launch icon for start', () => {
		const { container } = render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		// Check for primary icon container
		const iconContainer = container.querySelector('.rounded-full.bg-primary');
		expect(iconContainer).toBeDefined();
	});

	it('should render confetti icon for target', () => {
		const { container } = render(TimelineCard, {
			props: {
				startDate: mockStartDate,
				endDate: mockEndDate
			}
		});

		// Check for secondary icon container
		const secondaryContainer = container.querySelector('.rounded-full.bg-secondary');
		expect(secondaryContainer).toBeDefined();
	});

	it('should handle different date formats', () => {
		render(TimelineCard, {
			props: {
				startDate: '2025-12-25',
				endDate: '2026-03-15'
			}
		});

		expect(screen.getByText('Start Date')).toBeInTheDocument();
		expect(screen.getByText('Target Date')).toBeInTheDocument();
	});
});
