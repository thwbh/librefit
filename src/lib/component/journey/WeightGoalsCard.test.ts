// Register the shared @thwbh/veilchen mock before any import below loads the
// real module (vitest 5 hoists vi.mock to the top of tests/utils/mocks.ts).
import '../../../../tests/utils/mocks';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WeightGoalsCard from './WeightGoalsCard.svelte';

describe('WeightGoalsCard Component', () => {
	it('should render start and target labels', () => {
		render(WeightGoalsCard, {
			props: {
				initialWeight: 85,
				targetWeight: 80
			}
		});

		expect(screen.getByText('Start')).toBeInTheDocument();
		expect(screen.getByText('Target')).toBeInTheDocument();
	});

	it('should render weight difference', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				initialWeight: 85,
				targetWeight: 80
			}
		});

		expect(screen.getByText('5.0 kg')).toBeInTheDocument();
		expect(container).toBeDefined();
	});

	it('should handle weight gain scenario', () => {
		const { container } = render(WeightGoalsCard, {
			props: {
				initialWeight: 60,
				targetWeight: 70
			}
		});

		expect(screen.getByText('10.0 kg')).toBeInTheDocument();
		expect(container).toBeDefined();
	});
});
