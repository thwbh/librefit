import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import CalorieTrackerComponent from '$lib/components/tracker/CalorieTrackerComponent.svelte';
import * as skeleton from '@skeletonlabs/skeleton';
import { tick } from 'svelte';
import { extractModalStoreMockTriggerCallback } from '../../__mocks__/skeletonProxy';
import { getDateAsStr, getDaytimeFoodCategory } from '$lib/date';
import type { CalorieTarget, CalorieTracker, FoodCategory } from '$lib/model';

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
      calorieTarget: mockCalorieTarget
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
    const { component, getByRole } = render(CalorieTrackerComponent);

    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });
    component.$on('addCalories', dispatchMock);

    const amountInput = getByRole('spinbutton', { name: 'amount' });
    await fireEvent.input(amountInput, { target: { value: 100 } });

    const quickAddButton = getByRole('button', { name: 'add' });
    await fireEvent.click(quickAddButton);
    await tick();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toEqual({
      callback: expect.any(Function),
      value: 100,
      category: getDaytimeFoodCategory(new Date()),
      dateStr: getDateAsStr(new Date()),
      target: undefined
    });
  });

  it('should trigger the add button and dispatch addCalories', async () => {
    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });

    const { component, getByText } = render(CalorieTrackerComponent);
    component.$on('addCalories', dispatchMock);

    // Expect that the add button is rendered
    const addButton = getByText('Add');
    await fireEvent.click(addButton);
    await tick();

    expect(skeleton.getModalStore().trigger).toHaveBeenCalledWith({
      type: 'component',
      component: 'trackerModal',
      response: expect.any(Function),
      meta: {
        categories: undefined
      }
    });

    const callback = extractModalStoreMockTriggerCallback();
    await callback({
      detail: {
        close: true
      }
    });

    expect(dispatchMock).toHaveBeenCalledTimes(0);

    const callbackDetails = {
      dateStr: getDateAsStr(new Date()),
      value: 100,
      category: getDaytimeFoodCategory(new Date())
    };

    const callbackParams = {
      detail: {
        type: 'add',
        detail: callbackDetails
      }
    };

    await callback(callbackParams);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toEqual(callbackDetails);
  });

  it('should trigger the edit button and dispatch updateCalories', async () => {
    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });

    const { component, getByText } = render(CalorieTrackerComponent, {
      categories: mockCategories,
      calorieTracker: mockEntries,
      calorieTarget: mockCalorieTarget
    });
    component.$on('updateCalories', dispatchMock);

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

    expect(dispatchMock).toHaveBeenCalledTimes(0);

    const callbackDetails = {
      dateStr: getDateAsStr(new Date()),
      value: 100,
      id: 2,
      category: getDaytimeFoodCategory(new Date())
    };

    const callbackParams = {
      detail: {
        type: 'update',
        detail: callbackDetails
      }
    };

    await callback(callbackParams);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toEqual(callbackDetails);
  });

  it('should trigger the edit button and dispatch deleteCalories', async () => {
    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });

    const { component, getByText } = render(CalorieTrackerComponent, {
      categories: mockCategories,
      calorieTracker: mockEntries,
      calorieTarget: mockCalorieTarget
    });

    component.$on('deleteCalories', dispatchMock);

    const editButton = getByText('Edit');
    await fireEvent.click(editButton);
    await tick();

    const callback = extractModalStoreMockTriggerCallback();

    const callbackDetails = {
      dateStr: getDateAsStr(new Date()),
      id: 2
    };

    const callbackParams = {
      detail: {
        type: 'remove',
        detail: callbackDetails
      }
    };

    await callback(callbackParams);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toEqual(callbackDetails);
  });
});
