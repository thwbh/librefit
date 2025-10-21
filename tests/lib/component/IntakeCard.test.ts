import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IntakeCard from '../../../src/lib/component/intake/IntakeCard.svelte';
import type { CalorieTracker, FoodCategory } from '$lib/api/gen';

// Mock the CalorieTrackerMask component
vi.mock('../../../src/lib/component/intake/CalorieTrackerMask.svelte', () => ({
	default: vi.fn().mockImplementation((props) => {
		const mockComponent = {
			$$: { fragment: null, ctx: null },
			$set: vi.fn(),
			$destroy: vi.fn()
		};
		return mockComponent;
	})
}));

// Mock the longpress gesture
vi.mock('$lib/gesture/long-press', () => ({
	longpress: vi.fn((node, callback) => {
		node.addEventListener('longpress', callback);
		return {
			destroy() {
				node.removeEventListener('longpress', callback);
			}
		};
	})
}));

describe('IntakeCard Component', () => {
	const mockEntry: CalorieTracker = {
		id: 1,
		added: '2023-01-15',
		amount: 350,
		category: 'b',
		description: 'Banana and oats'
	};

	const mockCategories: FoodCategory[] = [
		{ longvalue: 'Breakfast', shortvalue: 'b' },
		{ longvalue: 'Lunch', shortvalue: 'l' },
		{ longvalue: 'Dinner', shortvalue: 'd' }
	];

	it('should render the IntakeCard component', () => {
		const mockOnLongPress = vi.fn();

		const { container } = render(IntakeCard, {
			props: {
				entry: mockEntry,
				categories: mockCategories,
				onlongpress: mockOnLongPress
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should apply correct CSS classes to the card', () => {
		const mockOnLongPress = vi.fn();

		const { container } = render(IntakeCard, {
			props: {
				entry: mockEntry,
				categories: mockCategories,
				onlongpress: mockOnLongPress
			}
		});

		const card = container.querySelector('.card');
		expect(card).toBeInTheDocument();
		expect(card).toHaveClass('card', 'w-full');
	});

	it('should pass through additional props', () => {
		const mockOnLongPress = vi.fn();

		const { container } = render(IntakeCard, {
			props: {
				entry: mockEntry,
				categories: mockCategories,
				onlongpress: mockOnLongPress,
				'data-testid': 'custom-intake-card',
				'aria-label': 'Calorie entry'
			}
		});

		const card = container.querySelector('.card');
		expect(card).toHaveAttribute('data-testid', 'custom-intake-card');
		expect(card).toHaveAttribute('aria-label', 'Calorie entry');
	});

	it('should handle minimal entry data', () => {
		const minimalEntry: CalorieTracker = {
			id: 2,
			added: '2023-01-15',
			amount: 100,
			category: 'l',
			description: undefined
		};

		const mockOnLongPress = vi.fn();

		const { container } = render(IntakeCard, {
			props: {
				entry: minimalEntry,
				categories: mockCategories,
				onlongpress: mockOnLongPress
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle empty categories array', () => {
		const mockOnLongPress = vi.fn();

		const { container } = render(IntakeCard, {
			props: {
				entry: mockEntry,
				categories: [],
				onlongpress: mockOnLongPress
			}
		});

		expect(container).toBeInTheDocument();
	});
});