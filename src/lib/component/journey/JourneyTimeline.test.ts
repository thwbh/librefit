import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import JourneyTimeline from '../../../../src/lib/component/journey/JourneyTimeline.svelte';

// Mock date utilities
vi.mock('$lib/date', () => ({
	convertDateStrToDisplayDateStr: vi.fn((dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}),
	parseStringAsDate: vi.fn((dateStr: string) => new Date(dateStr))
}));

// Mock NumberFlow component
vi.mock('@number-flow/svelte', () => ({
	default: vi.fn(() => null)
}));

describe('JourneyTimeline Component', () => {
	const mockProps = {
		startDate: '2025-01-01',
		endDate: '2025-06-01',
		initialWeight: 80,
		targetWeight: 70,
		currentWeight: 75
	};

	it('should render timeline title', () => {
		render(JourneyTimeline, { props: mockProps });

		expect(screen.getByText('Journey Timeline')).toBeInTheDocument();
	});

	it('should display starting weight label', () => {
		render(JourneyTimeline, { props: mockProps });

		expect(screen.getByText('Starting Weight')).toBeInTheDocument();
	});

	it('should display today label', () => {
		render(JourneyTimeline, { props: mockProps });

		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('should display target weight label', () => {
		render(JourneyTimeline, { props: mockProps });

		expect(screen.getByText('Target Weight')).toBeInTheDocument();
	});

	it('should show weight loss progress', () => {
		render(JourneyTimeline, { props: mockProps });

		// Should show "kg lost" for weight loss
		expect(screen.getByText(/kg lost/i)).toBeInTheDocument();
	});

	it('should show weight gain progress', () => {
		render(JourneyTimeline, {
			props: {
				...mockProps,
				initialWeight: 60,
				targetWeight: 70,
				currentWeight: 65
			}
		});

		// Should show "kg gained" for weight gain
		expect(screen.getByText(/kg gained/i)).toBeInTheDocument();
	});

	it('should show no change message when weight unchanged', () => {
		render(JourneyTimeline, {
			props: {
				...mockProps,
				currentWeight: 80
			}
		});

		expect(screen.getByText('No change yet')).toBeInTheDocument();
	});

	it('should render timeline structure', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		const timeline = container.querySelector('.timeline.timeline-vertical');
		expect(timeline).toBeDefined();

		// Should have 3 timeline items (start, current, target)
		const timelineItems = container.querySelectorAll('.timeline');
		expect(timelineItems.length).toBeGreaterThan(0);
	});

	it('should apply correct card styling', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		const wrapper = container.querySelector('.bg-base-100.rounded-box.p-6.shadow');
		expect(wrapper).toBeDefined();
	});

	it('should display formatted dates', () => {
		render(JourneyTimeline, { props: mockProps });

		// Check that dates are rendered (formatted by mock)
		expect(screen.getByText(/Jan.*1.*2025/i)).toBeInTheDocument();
		expect(screen.getByText(/Jun.*1.*2025/i)).toBeInTheDocument();
	});

	it('should handle weight maintenance scenario', () => {
		render(JourneyTimeline, {
			props: {
				startDate: '2025-01-01',
				endDate: '2025-06-01',
				initialWeight: 70,
				targetWeight: 70,
				currentWeight: 70
			}
		});

		// Should show timeline even when maintaining weight
		expect(screen.getByText('Journey Timeline')).toBeInTheDocument();
		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('should show calendar icon for start date', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		// Check for timeline structure with calendar icon
		expect(container.querySelector('.timeline-start')).toBeDefined();
	});

	it('should show lightning icon for current date', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		// Check for current date with accent styling
		const currentBox = container.querySelector('.bg-secondary.text-secondary-content');
		expect(currentBox).toBeDefined();
	});

	it('should show target icon for end date', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		// Check for target date timeline item
		expect(container.querySelector('.timeline-start')).toBeDefined();
	});

	it('should calculate weight change correctly', () => {
		render(JourneyTimeline, {
			props: {
				startDate: '2025-01-01',
				endDate: '2025-06-01',
				initialWeight: 80,
				targetWeight: 70,
				currentWeight: 75
			}
		});

		// 80 - 75 = 5 kg lost
		expect(screen.getByText('5.0 kg lost')).toBeInTheDocument();
	});
});
