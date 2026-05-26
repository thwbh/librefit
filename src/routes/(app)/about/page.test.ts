import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.stubGlobal('__APP_VERSION__', '0.0.0-test');

describe('about page', () => {
	it('[AS-005] should render the about page with app name, tagline, and version', () => {
		render(Page);

		expect(screen.getByText('LibreFit')).toBeTruthy();
		expect(screen.getByText('Track smarter. Live healthier.')).toBeTruthy();
		expect(screen.getByText(/Version 0\.0\.0-test/)).toBeTruthy();
	});

	it('[AS-005] should advertise privacy posture (data stays on device)', () => {
		render(Page);

		expect(screen.getByText('Your data stays on your device')).toBeTruthy();
		expect(screen.getByText(/No ads.*No tracking.*Open source/)).toBeTruthy();
	});
});
