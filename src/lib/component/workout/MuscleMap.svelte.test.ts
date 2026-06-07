import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MuscleMap from './MuscleMap.svelte';
import type { WorkedMuscle } from '$lib/workout/history';

const muscles: WorkedMuscle[] = [
	{ muscle: 'chest', primary: true },
	{ muscle: 'triceps', primary: false }
];

describe('MuscleMap', () => {
	it('[PG-010] renders the front/back maps with a primary/secondary legend', () => {
		render(MuscleMap, { props: { muscles } });
		expect(screen.getByText('Primary')).toBeInTheDocument();
		expect(screen.getByText('Secondary')).toBeInTheDocument();
		// Before any tap, the prompt is shown.
		expect(screen.getByText('Tap a muscle group for detail')).toBeInTheDocument();
	});

	it('[PG-011] tapping a muscle group names it and its role', async () => {
		const { container } = render(MuscleMap, { props: { muscles } });
		// svelte-body-highlighter inlines the SVG; click a path tagged with the slug.
		const chest = container.querySelector('[data-slug="chest"]');
		expect(chest).not.toBeNull();
		await fireEvent.click(chest!);
		expect(screen.getByText('Chest')).toBeInTheDocument();
		expect(screen.getByText(/primary/)).toBeInTheDocument();
	});
});
