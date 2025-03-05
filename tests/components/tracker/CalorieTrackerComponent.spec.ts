import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import CalorieTrackerComponent from '$lib/components/tracker/CalorieTrackerComponent.svelte';
import * as skeleton from '@skeletonlabs/skeleton';
import { tick } from 'svelte';
import { extractModalStoreMockTriggerCallback } from '../../__mocks__/skeletonProxy';
import { getDateAsStr, getDaytimeFoodCategory } from '$lib/date';
import type { CalorieTarget, CalorieTracker, FoodCategory, NewCalorieTracker } from '$lib/model';

const mockCategories: Array<FoodCategory> = [
  { shortvalue: 'b', longvalue: 'Breakfast' },
  { shortvalue: 'l', longvalue: 'Lunch' },
  { shortvalue: 'd', longvalue: 'Dinner' },
  { shortvalue: 't', longvalue: 'Treat' },
  { shortvalue: 's', longvalue: 'Snack' }
];

const mockEntries: Array<CalorieTracker> = [
  { added: '2023-11-10', id: 1, amount: 500, category: 'b' },
  { added: '2023-11-10', id: 2, amount: 300, category: 'l' },
  { added: '2023-11-10', id: 3, amount: 600, category: 'd' },
  { added: '2023-11-10', id: 4, amount: 200, category: 't' },
  { added: '2023-11-10', id: 5, amount: 150, category: 's' }
];

const mockCalorieTarget: CalorieTarget = {
  added: '2023-01-01',
  id: 1,
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  targetCalories: 2000,
  maximumCalories: 2400
};

/**
 * @vitest-environment jsdom
 */
describe('CalorieTrackerComponent.svelte component', () => {
  afterEach(() => cleanup());

  // Test that the CalorieTracker component renders correctly
  it('renders correctly', () => {
    const { getByText, getByRole, getByTestId } = render(CalorieTrackerComponent, {
      categories: mockCategories,
      calorieTracker: mockEntries,
      calorieTarget: mockCalorieTarget,
    });

    // heading
    expect(getByText('Calorie Tracker')).toBeTruthy();

    // radial
    expect(getByTestId('progress-radial')).toBeDefined();

    // deficit/surplus message
    expect(getByText(`You still have 250kcal left for the day. Good job!`));

    const amountInput = getByRole('spinbutton', { name: 'amount' });

    // tracker
    expect(getByText('kcal')).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();

    // quickadd
    expect(getByRole('button', { name: 'add calories' })).toBeTruthy();

    // button group
    expect(getByText('Add')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
  });

  it('should trigger the quick add button', async () => {
    const addMock = vi.fn();

    const { getByRole } = render(CalorieTrackerComponent, {
      props: { onAddCalories: addMock }
    });

    const amountInput = getByRole('spinbutton', { name: 'amount' });
    await fireEvent.input(amountInput, { target: { value: 100 } });

    const quickAddButton = getByRole('button', { name: 'add' });
    await fireEvent.click(quickAddButton);
    await tick();

    expect(addMock).toHaveBeenCalledExactlyOnceWith({
      amount: 100,
      category: getDaytimeFoodCategory(new Date()),
      added: getDateAsStr(new Date()),
      description: ''
    }, expect.any(Function));
  });

  it('should trigger the add button and dispatch addCalories', async () => {
    const addMock = vi.fn();

    const props = {
      categories: mockCategories,
      calorieTarget: mockCalorieTarget,
      onAddCalories: addMock
    }

    const { getByText } = render(CalorieTrackerComponent, { ...props });

    // Expect that the add button is rendered
    const addButton = getByText('Add');
    await fireEvent.click(addButton);
    await tick();

    expect(skeleton.getModalStore().trigger).toHaveBeenCalledWith({
      type: 'component',
      component: 'trackerModal',
      response: expect.any(Function),
      meta: {
        categories: mockCategories
      }
    });

    const callback = extractModalStoreMockTriggerCallback();

    const callbackDetails: NewCalorieTracker = {
      added: getDateAsStr(new Date()),
      amount: 100,
      category: getDaytimeFoodCategory(new Date()),
      description: ''
    };

    const callbackParams = {
      detail: {
        type: 'add',
        details: callbackDetails,
        buttonEvent: { callback }
      }
    };

    await callback(callbackParams);

    expect(addMock).toHaveBeenCalledExactlyOnceWith(callbackParams.detail.details, callbackParams.detail.buttonEvent.callback);
  });

  it('should trigger the edit button and dispatch updateCalories', async () => {
    const updateMock = vi.fn();

    const { getByText } = render(CalorieTrackerComponent, {
      categories: mockCategories,
      calorieTracker: mockEntries,
      calorieTarget: mockCalorieTarget,
      onUpdateCalories: updateMock
    });

    const editButton = getByText('Edit');
    await fireEvent.click(editButton);
    await tick();

    expect(skeleton.getModalStore().trigger).toHaveBeenCalledWith({
      type: 'component',
      component: 'trackerModal',
      response: expect.any(Function),
      meta: {
        categories: mockCategories,
        entries: mockEntries
      }
    });

    const callback = extractModalStoreMockTriggerCallback();
    await callback({
      detail: {
        close: true
      }
    });

    expect(updateMock).toHaveBeenCalledTimes(0);

    const callbackDetails = {
      added: getDateAsStr(new Date()),
      amount: 100,
      id: 2,
      category: getDaytimeFoodCategory(new Date())
    };

    const callbackParams = {
      detail: {
        type: 'update',
        details: callbackDetails,
        buttonEvent: { callback }
      }
    };

    await callback(callbackParams);

    expect(updateMock).toHaveBeenCalledExactlyOnceWith(callbackParams.detail.details, callbackParams.detail.buttonEvent.callback);
  });

  it('should trigger the edit button and dispatch deleteCalories', async () => {
    const deleteMock = vi.fn();

    const { getByText } = render(CalorieTrackerComponent, {
      categories: mockCategories,
      calorieTracker: mockEntries,
      calorieTarget: mockCalorieTarget,
      onDeleteCalories: deleteMock
    });

    const editButton = getByText('Edit');
    await fireEvent.click(editButton);
    await tick();

    const callback = extractModalStoreMockTriggerCallback();

    expect(callback).toBeTruthy();

    const callbackDetails = {
      dateStr: getDateAsStr(new Date()),
      id: 2
    };

    const callbackParams = {
      detail: {
        type: 'remove',
        details: callbackDetails,
        buttonEvent: { callback }
      }
    };

    await callback(callbackParams);

    expect(deleteMock).toHaveBeenCalledExactlyOnceWith(callbackParams.detail.details, callbackParams.detail.buttonEvent.callback);
  });
});
