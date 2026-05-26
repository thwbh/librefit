import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Body from './Body.svelte';
import type { LibreUser, WizardInput } from '$lib/api/gen';
import { CalculationSexSchema } from '$lib/api/gen';

function makeProps() {
	const wizardInput: WizardInput = $state({
		age: 30,
		sex: CalculationSexSchema.enum.MALE,
		weight: 85,
		height: 180,
		activityLevel: 1,
		weeklyDifference: 1,
		calculationGoal: 'LOSS'
	} as WizardInput);

	const userData: LibreUser = $state({ id: 1, name: 'Arnie', avatar: '' });

	return { wizardInput, userData };
}

describe('Body', () => {
	it('[OB-005] should render the nickname, sex, age, height, and weight inputs', () => {
		const props = makeProps();
		render(Body, { props });

		// Nickname field is labelled "Nickname".
		expect(screen.getByLabelText(/Nickname/i)).toBeTruthy();

		// Sex is a ButtonGroup with Male/Female entries.
		expect(screen.getByRole('button', { name: /Male/ })).toBeTruthy();
		expect(screen.getByRole('button', { name: /Female/ })).toBeTruthy();

		// Range inputs for age/height/weight are present.
		expect(screen.getByText(/Age/)).toBeTruthy();
		expect(screen.getByText(/Height/)).toBeTruthy();
		expect(screen.getByText(/Weight/)).toBeTruthy();
	});

	it('[OB-005] should reflect updated wizardInput values on the range inputs', () => {
		const props = makeProps();
		props.wizardInput.age = 42;
		props.wizardInput.height = 175;
		props.wizardInput.weight = 70;

		render(Body, { props });

		const ranges = Array.from(
			document.querySelectorAll<HTMLInputElement>('input[type="range"]')
		).map((el) => el.value);

		// Order in Body.svelte is Age, Height, Weight.
		expect(ranges).toContain('42');
		expect(ranges).toContain('175');
		expect(ranges).toContain('70');
	});
});
