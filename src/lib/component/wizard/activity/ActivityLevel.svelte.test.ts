import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ActivityLevel from './ActivityLevel.svelte';
import { activityLevels } from '$lib/activity';

describe('ActivityLevel', () => {
	it('[OB-008] should render an option card for every activity level', () => {
		render(ActivityLevel, { props: { value: 1 } });

		for (const level of activityLevels) {
			expect(screen.getAllByText(level.label).length).toBeGreaterThan(0);
		}
	});

	it('[OB-008] should bind the selected level back to the parent', async () => {
		const user = userEvent.setup();
		const props = $state({ value: 1 });
		render(ActivityLevel, { props });

		// Pick the second activity level by its label
		const second = activityLevels[1];
		// OptionCards renders each option as a clickable region; click the header text.
		await user.click(screen.getAllByText(second.label)[0]);

		expect(props.value).toBe(second.level);
	});
});
