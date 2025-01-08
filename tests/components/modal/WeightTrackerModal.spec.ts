import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WeightModal from '$lib/components/modal/WeightTrackerModal.svelte';
import { tick } from 'svelte';
import { updateModalStoreMock } from '../../__mocks__/skeletonProxy'; // Adapt this to your needs

/**
 * @vitest-environment jsdom
 */
describe('WeightTrackerModal.svelte component', () => {
	afterEach(() => cleanup());

	/**
	 * Given a component with already filled-in entries
	 * - render component with two entries filled and one empty (number of TrackerInput components: 2)
	 * - for the 2nd entry, click 'delete' and confirm
	 * - callback type 'remove' must have been triggered once with data to remove
	 */
	it('should render a prefilled component and remove an entry', async () => {
		const mockData = {
			weightList: [
				{ added: '2022-02-02', weight: 61, id: 1 },
				{ added: '2022-02-02', weight: 60, id: 2 }
			]
		};

		const responseCallback = vi.fn();
		updateModalStoreMock({ meta: mockData, callback: responseCallback });

		const { getAllByRole, getByRole } = render(WeightModal);

		await fireEvent.click(getAllByRole('button', { name: 'delete' })[1]);
		await fireEvent.click(getByRole('button', { name: 'confirm' }));
		await tick();

		expect(responseCallback).toHaveBeenCalledTimes(1);

		// Customize this with the expected output from your code
		const expectedDetail = {
			type: 'remove',
			close: true,
			detail: {
				dateStr: '2022-02-02',
				id: 2,
				target: null,
				callback: expect.any(Function)
			}
		};

		expect(responseCallback).toHaveBeenCalledWith({ detail: expectedDetail });
	});

	/**
	 * Given a component with already filled-in entries
	 * - render component with two filled entries (number of TrackerInput components: 2)
	 * - for the 2nd entry, click 'update' and confirm
	 * - callback type 'update' must have been triggered once with data to update
	 */
	it('should render a already filled component and update one entry', async () => {
		const mockData = {
			weightList: [
				{ added: '2022-02-02', weight: 71, id: 1 },
				{ added: '2022-02-02', weight: 70, id: 2 }
			]
		};

		const responseCallback = vi.fn();

		updateModalStoreMock({ meta: mockData, callback: responseCallback });

		const { getAllByRole, getByRole } = render(WeightModal);

		await fireEvent.click(getAllByRole('button', { name: 'edit' })[1]);
		await fireEvent.input(getAllByRole('spinbutton', { name: 'amount' })[1], {
			target: { value: 75 }
		});
		await fireEvent.click(getByRole('button', { name: 'confirm' }));
		await tick();

		expect(responseCallback).toHaveBeenCalledTimes(1);

		// Customize this with the expected output from your code
		const expectedDetail = {
			type: 'update',
			close: true,
			detail: {
				dateStr: '2022-02-02',
				id: 2,
				value: 75,
				callback: expect.any(Function)
			}
		};

		expect(responseCallback).toHaveBeenCalledWith({ detail: expectedDetail });
	});
});
