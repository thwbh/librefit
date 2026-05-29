import { describe, it, expect } from 'vitest';
import { deriveStep4Title, type StepConfigEntry } from './title';

const stepConfig: StepConfigEntry[] = [
	{ title: 'Body Parameters', subtitle: "Let's start with some basic information about you" },
	{ title: 'Activity Level', subtitle: 'How active are you during your day?' },
	{ title: 'Your Results', subtitle: "Here's what your body composition looks like" },
	{ title: 'Choose Your Pace', subtitle: 'Select a rate that fits your lifestyle' },
	{ title: 'Your Plan', subtitle: "Here's your customized fitness journey" }
];

describe('deriveStep4Title', () => {
	it('[OB-014] step 4 with HOLD recommendation flips to "Select Your Target Weight"', () => {
		const config = deriveStep4Title(stepConfig, 4, 'HOLD');
		expect(config.title).toBe('Select Your Target Weight');
		expect(config.subtitle).toBe('Choose a target weight within your healthy range');
	});

	it('[OB-014] step 4 with LOSE recommendation keeps base "Choose Your Pace" title', () => {
		const config = deriveStep4Title(stepConfig, 4, 'LOSE');
		expect(config.title).toBe('Choose Your Pace');
		expect(config.subtitle).toBe('Select a rate that fits your lifestyle');
	});

	it('[OB-014] step 4 with GAIN recommendation keeps base "Choose Your Pace" title', () => {
		const config = deriveStep4Title(stepConfig, 4, 'GAIN');
		expect(config.title).toBe('Choose Your Pace');
	});

	it('[OB-014] non-step-4 with HOLD recommendation is unaffected', () => {
		const step1 = deriveStep4Title(stepConfig, 1, 'HOLD');
		expect(step1.title).toBe('Body Parameters');
		const step3 = deriveStep4Title(stepConfig, 3, 'HOLD');
		expect(step3.title).toBe('Your Results');
	});

	it('[OB-014] icon and other fields from base config are preserved on the HOLD override', () => {
		const fakeIcons = stepConfig.map((_, i) => `icon-${i}` as unknown as StepConfigEntry['icon']);
		const withIcon: StepConfigEntry[] = stepConfig.map((c, i) => ({ ...c, icon: fakeIcons[i] }));
		const config = deriveStep4Title(withIcon, 4, 'HOLD');
		expect(config.icon).toBe(fakeIcons[3]);
	});
});
