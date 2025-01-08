import { render, fireEvent, cleanup, screen } from '@testing-library/svelte';
import { afterEach, expect, describe, it, vi } from 'vitest';
import TrackerInput from '$lib/components/TrackerInput.svelte';
import { tick } from 'svelte';
import type { FoodCategory } from '$lib/model';

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
    const mockData = {
      value: '',
      dateStr: '2024-12-31',
      unit: 'kg'
    };

    let addEvent: any;
    const addMock = vi.fn((event) => (addEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });

    component.$on('add', addMock);

    const unitDisplay = screen.getByText(mockData.unit);
    const amountInput = screen.getByRole('spinbutton', { name: 'amount' });

    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();

    // check correct buttons being visible/invisible
    expect(screen.queryByRole('button', { name: 'add' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount and click 'add'
    await fireEvent.input(amountInput, { target: { value: 50 } });
    await fireEvent.click(screen.getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      callback: expect.any(Function),
      value: 50,
      id: undefined,
      category: undefined,
      dateStr: mockData.dateStr
    });
  });

  it('should render a blank component with categories and trigger add', async () => {
    const mockData = {
      categories: categories,
      category: 'b', // set here to avoid time based issues
      unit: 'kcal',
      value: '',
      dateStr: '2025-01-01'
    };

    let addEvent;
    const addMock = vi.fn((event) => (addEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });
    component.$on('add', addMock);

    const unitDisplay = screen.getByText(mockData.unit);
    const amountInput = screen.getByRole('spinbutton', { name: 'amount' });
    const categoryCombobox = screen.getByRole('combobox', { name: 'category' });

    // check values that can be set by the user
    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeFalsy();
    expect(categoryCombobox['value']).toStrictEqual('b');

    // check correct buttons being visible/invisible
    expect(screen.queryByRole('button', { name: 'add' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount + category and click 'add'
    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.change(categoryCombobox, { target: { value: 'd' } });

    expect(amountInput['value']).toStrictEqual('100');
    expect(categoryCombobox['value']).toStrictEqual('d');

    await fireEvent.click(screen.getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      callback: expect.any(Function),
      category: 'd',
      value: 100,
      id: undefined,
      dateStr: mockData.dateStr
    });
  });

  it('should render a filled component without categories', async () => {
    const mockData = {
      id: 1,
      dateStr: '2022-02-02',
      existing: false,
      categories: categories,
      category: 'b', // set here to avoid time based issues
      unit: 'kcal',
      value: 500
    };

    let addEvent: any;
    const addMock = vi.fn((event) => (addEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });

    component.$on('add', addMock);

    const unitDisplay = screen.getByText('kcal');
    const amountInput = screen.getByRole('spinbutton', { name: 'amount' });
    const categoryCombobox = screen.getByRole('combobox', { name: 'category' });

    // check values that can be set by the user
    expect(unitDisplay).toBeDefined();
    expect(amountInput['placeholder']).toEqual('Amount...');
    expect(amountInput['value']).toBeTruthy();
    expect(categoryCombobox['value']).toStrictEqual('b');

    // check correct buttons being visible/invisible
    expect(screen.queryByRole('button', { name: 'add' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();

    // change amount + category and click 'add'
    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.change(categoryCombobox, { target: { value: 'd' } });

    expect(amountInput['value']).toStrictEqual('100');
    expect(categoryCombobox['value']).toStrictEqual('d');

    await fireEvent.click(screen.getByRole('button', { name: 'add' }));
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);

    expect(addEvent).toEqual({
      callback: expect.any(Function),
      dateStr: '2022-02-02',
      id: 1,
      category: 'd',
      value: 100
    });
  });

  it('should enter edit mode, change and confirm the change', async () => {
    const mockData = {
      value: 70,
      unit: 'kg',
      existing: true,
      dateStr: '2022-02-02'
    };

    let updateEvent: any;
    const updateMock = vi.fn((event) => (updateEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });

    component.$on('update', updateMock);

    const editButton = screen.queryByRole('button', { name: 'edit' });
    const deleteButton = screen.queryByRole('button', { name: 'delete' });
    const confirmButton = screen.queryByRole('button', { name: 'confirm' });
    const discardButton = screen.queryByRole('button', { name: 'discard' });

    expect(screen.queryByRole('button', { name: 'add' })).toBeNull();
    expect(editButton).toBeDefined();
    expect(deleteButton).toBeDefined();
    expect(confirmButton).toBeNull();
    expect(discardButton).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'edit' }));
    await tick();

    // check correct buttons being visible/invisible
    // expected: edit and delete disappear from the dom, confirm and discard appear
    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(confirmButton).toBeDefined();
    expect(discardButton).toBeDefined();

    await fireEvent.input(screen.getByRole('spinbutton', { name: 'amount' }), {
      target: { value: 100 }
    });
    await fireEvent.click(screen.queryByRole('button', { name: 'confirm' }));
    await tick();

    expect(updateMock).toHaveBeenCalledTimes(1);

    expect(updateEvent).toEqual({
      callback: expect.any(Function),
      value: 100,
      category: undefined,
      dateStr: "2022-02-02",
      id: undefined
    });

    // after the update event finishes, confirm and discard should disappear
    expect(confirmButton).toBeNull();
    expect(discardButton).toBeNull();

    // edit and delete should reappear
    expect(editButton).toBeDefined();
    expect(deleteButton).toBeDefined();
  });

  it('should enter edit mode, change and cancel the change', async () => {
    const mockData = {
      value: 870,
      unit: 'kcal',
      categories: categories,
      category: 'b', // set here to avoid time based issues
      existing: true,
      dateStr: '2023-01-21',
    };

    let updateEvent;
    const updateMock = vi.fn((event) => (updateEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });
    component.$on('update', updateMock);

    const amountInput = screen.getByRole('spinbutton', { name: 'amount' });

    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'edit' }));
    await tick();

    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.input(amountInput, { target: { value: 100 } });
    await fireEvent.click(screen.getByRole('button', { name: 'discard' }));
    await tick();

    expect(updateMock).toHaveBeenCalledTimes(0);
    expect(updateEvent).toBeUndefined();
    expect(+amountInput['value']).toEqual(mockData.value);

    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();
  });

  it('should enter delete mode and confirm the delete', async () => {
    const mockData = {
      value: 780,
      unit: 'kcal',
      existing: true,
      dateStr: '2023-01-21',
    };

    const deleteMock = vi.fn();

    const { component } = render(TrackerInput, { ...mockData });
    component.$on('remove', deleteMock);

    const deleteButton = screen.queryByRole('button', { name: 'delete' });

    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(deleteButton).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();

    await fireEvent.click(deleteButton);
    await tick();

    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.click(screen.queryByRole('button', { name: 'confirm' }));
    await tick();

    expect(deleteMock).toHaveBeenCalledTimes(1);

    // button state does not matter here, the element is supposed to disappear after deletion
  });

  it('should enter delete mode and cancel the delete', async () => {
    const mockData = {
      value: 70,
      unit: 'kg',
      existing: true,
      dateStr: '2022-02-02'
    };

    let deleteEvent;
    const deleteMock = vi.fn((event) => (deleteEvent = event.detail));

    const { component } = render(TrackerInput, { ...mockData });
    component.$on('delete', deleteMock);

    const deleteButton = screen.queryByRole('button', { name: 'delete' });

    await fireEvent.click(deleteButton);
    await tick();

    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).not.toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'discard' }));
    await tick();

    expect(deleteMock).toHaveBeenCalledTimes(0);
    expect(deleteEvent).toBeUndefined();

    expect(deleteButton).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'discard' })).toBeNull();
  });
});
