import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import JourneyTimeline from './JourneyTimeline.svelte';

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

	it('should display today label', () => {
		render(JourneyTimeline, { props: mockProps });

		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('should display days left', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		expect(container.textContent).toMatch(/days left/);
	});

	it('should show weight loss progress', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		expect(container.textContent).toMatch(/5\.0 kg/);
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

	it('should render progress bar', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		const track = container.querySelector('.journey-bar-track');
		const fill = container.querySelector('.journey-bar-fill');
		expect(track).toBeTruthy();
		expect(fill).toBeTruthy();
	});

	it('should apply primary card styling', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		const wrapper = container.querySelector('.bg-primary');
		expect(wrapper).toBeTruthy();
	});

	it('should display formatted dates', () => {
		render(JourneyTimeline, { props: mockProps });

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

		expect(screen.getByText('Journey Timeline')).toBeInTheDocument();
		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('should render today callout with inverted colors', () => {
		const { container } = render(JourneyTimeline, { props: mockProps });

		const todayCallout = container.querySelector('.bg-primary-content.text-primary');
		expect(todayCallout).toBeTruthy();
	});
});
