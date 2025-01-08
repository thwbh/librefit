import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import { updateModalStoreMock } from '../../__mocks__/skeletonProxy';
import CalorieTrackerModal from '$lib/components/modal/CalorieTrackerModal.svelte';

/**
 * @vitest-environment jsdom
 */
describe('CalorieTrackerModal.svelte component', () => {
  afterEach(() => cleanup());

  /*
   * Expectations:
   *  - render an empty component with one empty entry (number of TrackerInput components: 1)
   *  - change default data, click 'add'
   *  - callback with type 'add' must have been triggered once with data to add
   */
  it('should render a pristine component and add an entry', async () => {
    const mockData = {
      categories: [
        { shortvalue: 'b', longvalue: 'Breakfast' },
        { shortvalue: 'l', longvalue: 'Lunch' },
        { shortvalue: 'd', longvalue: 'Dinner' }
      ],
      entries: [
        {
          // there must always be one entry prepended or otherwise the component won't have any controls
          added: '2022-02-02',
          id: undefined,
          category: 'l'
        }
      ]
    };

    const responseCallback = vi.fn();

    updateModalStoreMock({ meta: mockData, callback: responseCallback });

    const { getByRole } = render(CalorieTrackerModal);

    // for now there should be only one of those components each
    const amountInput: HTMLElement = getByRole('spinbutton', { name: 'amount' });
    const categoryCombobox: HTMLElement = getByRole('combobox', { name: 'category' });

    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();
    expect(categoryCombobox['value']).toStrictEqual('l');

    // change amount + category and click 'add'
    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.change(categoryCombobox, { target: { value: 'd' } });

    expect(amountInput['value']).toStrictEqual('100');
    expect(categoryCombobox['value']).toStrictEqual('d');

    await fireEvent.click(getByRole('button', { name: 'add' }));
    await tick();

    expect(responseCallback).toHaveBeenCalledTimes(1);
    expect(responseCallback).toHaveBeenCalledWith({
      detail: {
        type: 'add',
        close: true,
        detail: {
          value: 100,
          category: 'd',
          dateStr: '2022-02-02',
          id: undefined,
          callback: expect.any(Function)
        }
      }
    });
  });

  /*
   * Expectations
   * 	- render component with two entries filled and one empty (number of TrackerInput components: 3)
   *  - for the 2nd entry (lunch), click 'delete' and confirm
   *  - callback type 'remove' must have been triggered once with data to remove
   */
  it('should render a prefilled component and remove an entry', async () => {
    const lunch = { added: '2022-02-02', amount: 500, id: 1, category: 'l' };
    const dinner = { added: '2022-02-02', amount: 500, id: 2, category: 'd' };
    const empty = { added: '2022-02-02', id: undefined, category: 'l' };

    let mockData = {
      categories: [
        { shortvalue: 'b', longvalue: 'Breakfast', visible: true },
        { shortvalue: 'l', longvalue: 'Lunch', visible: true },
        { shortvalue: 'd', longvalue: 'Dinner', visible: true }
      ],
      entries: [empty, lunch, dinner]
    };

    const responseCallback = vi.fn();

    updateModalStoreMock({ meta: mockData, callback: responseCallback });

    const { getByRole, getAllByRole } = render(CalorieTrackerModal, { ...mockData });

    // the empty entry does not have a delete button, so the index shifts by -1
    const deleteButton = getAllByRole('button', { name: 'delete' })[0];
    await fireEvent.click(deleteButton);

    const confirmButton = getByRole('button', { name: 'confirm' });
    await fireEvent.click(confirmButton);
    await tick();

    expect(responseCallback).toHaveBeenCalledTimes(1);
    expect(responseCallback).toHaveBeenCalledWith({
      detail: {
        type: 'remove',
        close: true,
        detail: {
          callback: expect.any(Function),
          dateStr: lunch.added,
          id: lunch.id,
          target: null
        }
      }
    });
  });

  /*
   * Expectations
   *  - render component with one entry filled and one empty (number of TrackerInput components: 2)
   *  - for the filled entry click 'update' and confirm
   *  - callback type 'update' must have been triggered once with data to update
   */
  it('should render a prefilled component and update one entry', async () => {
    const breakfast = { added: '2022-02-02', amount: 500, id: 1, category: 'b' };
    const empty = { added: '2022-02-02', id: undefined, category: 'l' };

    const mockData = {
      categories: [
        { shortvalue: 'b', longvalue: 'Breakfast', visible: true },
        { shortvalue: 'l', longvalue: 'Lunch', visible: true },
        { shortvalue: 'd', longvalue: 'Dinner', visible: true }
      ],
      entries: [empty, breakfast]
    };

    const responseCallback = vi.fn();

    updateModalStoreMock({ meta: mockData, callback: responseCallback });

    const { getByRole, getAllByRole } = render(CalorieTrackerModal);

    await fireEvent.click(getByRole('button', { name: 'edit' }));
    await fireEvent.input(getAllByRole('spinbutton', { name: 'amount' })[1], {
      target: { value: 600 }
    });
    await fireEvent.click(getByRole('button', { name: 'confirm' }));
    await tick();

    expect(responseCallback).toHaveBeenCalledTimes(1);
    expect(responseCallback).toHaveBeenCalledWith({
      detail: {
        type: 'update',
        close: true,
        detail: {
          callback: expect.any(Function),
          id: 1,
          dateStr: '2022-02-02',
          category: 'b',
          value: 600
        }
      }
    });
  });
});
