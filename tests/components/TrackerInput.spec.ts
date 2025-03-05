import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { afterEach, expect, describe, it, vi } from 'vitest';
import TrackerInput from '$lib/components/TrackerInput.svelte';
import { tick } from 'svelte';
import type { CalorieTracker, FoodCategory, NewCalorieTracker, NewWeightTracker, WeightTracker } from '$lib/model';
import type { TrackerInputEvent } from '$lib/event';

const categories: Array<FoodCategory> = [
  { shortvalue: 'b', longvalue: 'Breakfast' },
  { shortvalue: 'd', longvalue: 'Dinner' }
];

/**
 * @vitest-environment jsdom
 */
describe('TrackerInput.svelte', () => {
  afterEach(() => cleanup());

  it('should render a blank component and trigger add', async () => {
    let addEvent: TrackerInputEvent<NewWeightTracker>;
    const addMock = vi.fn((event: TrackerInputEvent<NewWeightTracker>) => addEvent = event);

    const mockData = {
      value: '',
      dateStr: '2024-12-31',
      unit: 'kg',
      onAdd: addMock
    };

    let { getByRole, queryByRole, getByText } = render(TrackerInput, { ...mockData });

    const unitDisplay = getByText(mockData.unit);
    const amountInput = getByRole('spinbutton', { name: 'amount' });

    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();

    // check correct buttons being visible/invisible
    expect(queryByRole('button', { name: 'add' })).toBeDefined();
    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount and click 'add'
    await fireEvent.input(amountInput, { target: { value: 50 } });
    await fireEvent.click(getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      details: {
        amount: 50,
        id: undefined,
        category: undefined,
        added: mockData.dateStr
      }, buttonEvent: {
        callback: expect.any(Function)
      }
    });
  });

  it('should render a blank component with categories and trigger add', async () => {
    let addEvent: TrackerInputEvent<NewCalorieTracker>;
    const addMock = vi.fn((event: TrackerInputEvent<NewCalorieTracker>) => (addEvent = event));

    const mockData = {
      categories: categories,
      category: 'b', // set here to avoid time based issues
      unit: 'kcal',
      value: '',
      dateStr: '2025-01-01',
      onAdd: addMock
    };


    let { getByRole, getByText, queryByRole } = render(TrackerInput, { ...mockData });

    const unitDisplay = getByText(mockData.unit);
    const amountInput = getByRole('spinbutton', { name: 'amount' });
    const categoryCombobox = getByRole('combobox', { name: 'category' });

    // check values that can be set by the user
    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();
    expect(categoryCombobox['value']).toStrictEqual('b');

    // check correct buttons being visible/invisible
    expect(queryByRole('button', { name: 'add' })).toBeDefined();
    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount + category and click 'add'
    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.change(categoryCombobox, { target: { value: 'd' } });

    expect(amountInput['value']).toStrictEqual('100');
    expect(categoryCombobox['value']).toStrictEqual('d');

    await fireEvent.click(getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      details: {
        category: 'd',
        amount: 100,
        id: undefined,
        added: mockData.dateStr
      }, buttonEvent: {
        callback: expect.any(Function),
      }
    });
  });

  it('should render a filled component without categories', async () => {
    let addEvent: TrackerInputEvent<CalorieTracker>;
    const addMock = vi.fn((event: TrackerInputEvent<CalorieTracker>) => (addEvent = event));

    const mockData = {
      id: 1,
      dateStr: '2022-02-02',
      existing: false,
      categories: categories,
      category: 'b', // set here to avoid time based issues
      unit: 'kcal',
      value: 500
    };

    let { getByText, getByRole, queryByRole } = render(TrackerInput, { ...mockData, onAdd: addMock });

    const unitDisplay = getByText('kcal');
    const amountInput = getByRole('spinbutton', { name: 'amount' });
    const categoryCombobox = getByRole('combobox', { name: 'category' });

    // check values that can be set by the user
    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeTruthy();
    expect(categoryCombobox['value']).toStrictEqual('b');

    // check correct buttons being visible/invisible
    expect(queryByRole('button', { name: 'add' })).toBeDefined();
    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount + category and click 'add'
    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.change(categoryCombobox, { target: { value: 'd' } });

    expect(amountInput['value']).toStrictEqual('100');
    expect(categoryCombobox['value']).toStrictEqual('d');

    await fireEvent.click(getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      details: {
        added: '2022-02-02',
        id: 1,
        category: 'd',
        amount: 100
      }, buttonEvent: { callback: expect.any(Function) }
    });
  });


  it('should enter edit mode, change and confirm the change', async () => {
    const updateMock = vi.fn();

    const mockData = {
      value: 70,
      unit: 'kg',
      existing: true,
      dateStr: '2022-02-02',
      onUpdate: updateMock
    };

    let { getByRole, queryByRole } = render(TrackerInput, { ...mockData, onUpdate: updateMock, existing: true });

    const editButton = queryByRole('button', { name: 'edit' });
    const deleteButton = queryByRole('button', { name: 'delete' });
    const confirmButton = queryByRole('button', { name: 'confirm' });
    const discardButton = queryByRole('button', { name: 'discard' });

    expect(queryByRole('button', { name: 'add' })).toBeNull();
    expect(editButton).toBeDefined();
    expect(deleteButton).toBeDefined();
    expect(confirmButton).toBeNull();
    expect(discardButton).toBeNull();

    await fireEvent.click(getByRole('button', { name: 'edit' }));
    await tick();

    // check correct buttons being visible/invisible
    // expected: edit and delete disappear from the dom, confirm and discard appear
    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(confirmButton).toBeDefined();
    expect(discardButton).toBeDefined();

    await fireEvent.input(getByRole('spinbutton', { name: 'amount' }), {
      target: { value: 100 }
    });

    expect(getByRole('spinbutton', { name: 'amount' })['value']).toStrictEqual('100');

    await fireEvent.click(queryByRole('button', { name: 'confirm' }));
    await tick();

    expect(updateMock).toHaveBeenCalledExactlyOnceWith({
      details: {
        amount: 100,
        category: undefined,
        added: "2022-02-02",
        id: undefined
      }, buttonEvent: { callback: expect.any(Function) }
    });

    // after the update event finishes, confirm and discard should disappear
    expect(confirmButton).toBeNull();
    expect(discardButton).toBeNull();

    // edit and delete should reappear
    expect(editButton).toBeDefined();
    expect(deleteButton).toBeDefined();
  });

  it('should enter edit mode, change and cancel the change', async () => {

    let updateEvent: TrackerInputEvent<CalorieTracker>;
    const updateMock = vi.fn((event: TrackerInputEvent<CalorieTracker>) => (updateEvent = event));

    const mockData = {
      value: 870,
      unit: 'kcal',
      categories: categories,
      category: 'b', // set here to avoid time based issues
      existing: true,
      dateStr: '2023-01-21',
      onUpdate: updateMock
    };

    let { getByRole, queryByRole } = render(TrackerInput, { ...mockData });

    const amountInput = getByRole('spinbutton', { name: 'amount' });

    expect(queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(queryByRole('button', { name: 'delete' })).not.toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();

    await fireEvent.click(getByRole('button', { name: 'edit' }));
    await tick();

    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.click(getByRole('button', { name: 'discard' }));
    await tick();

    expect(updateMock).toHaveBeenCalledTimes(0);
    expect(updateEvent).toBeUndefined();
    expect(+amountInput['value']).toEqual(mockData.value);

    expect(queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(queryByRole('button', { name: 'delete' })).not.toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();
  });

  it('should enter delete mode and confirm the delete', async () => {
    const deleteMock = vi.fn();

    const mockData = {
      value: 780,
      unit: 'kcal',
      existing: true,
      dateStr: '2023-01-21',
      onDelete: deleteMock
    };

    let { queryByRole } = render(TrackerInput, { ...mockData });

    const deleteButton = queryByRole('button', { name: 'delete' });

    expect(queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(deleteButton).not.toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();

    await fireEvent.click(deleteButton);
    await tick();

    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.click(queryByRole('button', { name: 'confirm' }));
    await tick();

    expect(deleteMock).toHaveBeenCalledTimes(1);

    // button state does not matter here, the element is supposed to disappear after deletion
  });

  it('should enter delete mode and cancel the delete', async () => {
    let deleteEvent: TrackerInputEvent<WeightTracker>;
    const deleteMock = vi.fn((event: TrackerInputEvent<WeightTracker>) => (deleteEvent = event));

    const mockData = {
      value: 70,
      unit: 'kg',
      existing: true,
      dateStr: '2022-02-02'
    };

    let { getByRole, queryByRole } = render(TrackerInput, { ...mockData });

    const deleteButton = queryByRole('button', { name: 'delete' });

    await fireEvent.click(deleteButton);
    await tick();

    expect(queryByRole('button', { name: 'delete' })).toBeNull();
    expect(queryByRole('button', { name: 'edit' })).toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.click(getByRole('button', { name: 'discard' }));
    await tick();

    expect(deleteMock).toHaveBeenCalledTimes(0);
    expect(deleteEvent).toBeUndefined();

    expect(deleteButton).not.toBeNull();
    expect(queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'discard' })).toBeNull();
  });
});
