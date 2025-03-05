import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import WeightTrackerComponent from '$lib/components/tracker/WeightTrackerComponent.svelte';
import { tick } from 'svelte';
import * as skeleton from '@skeletonlabs/skeleton';
import { extractModalStoreMockTriggerCallback } from '../../__mocks__/skeletonProxy';
import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
import type { WeightTracker } from '$lib/model';

const mockData = {
  weightList: [
    { amount: 70, added: '2022-01-01', id: 1 },
    { amount: 69, added: '2022-02-01', id: 2 }
  ],
  weightTarget: {
    id: 1,
    added: '2022-08-01',
    initialWeight: 70,
    targetWeight: 60,
    startDate: '2022-08-01',
    endDate: '2023-01-01'
  }
};

/**
 * @vitest-environment jsdom
 */
describe('WeightTrackerComponent.svelte component', () => {
  afterEach(() => cleanup());

  it('renders correctly', async () => {
    const { getByText } = render(WeightTrackerComponent, mockData);

    expect(
      getByText(
        `Current weight: ${mockData.weightList[0].amount}kg (${convertDateStrToDisplayDateStr(mockData.weightList[0].added)})`
      )
    ).toBeDefined();

    expect(
      getByText(
        `Target: ${mockData.weightTarget.targetWeight}kg @ (${convertDateStrToDisplayDateStr(mockData.weightTarget.endDate)})`
      )
    ).toBeDefined();
  });

  it('renders an empty component correctly', () => {
    const { getByText } = render(WeightTrackerComponent);

    expect(getByText('Nothing tracked for today. Now would be a good moment!')).toBeDefined();
    expect(getByText(`No target weight set.`)).toBeDefined();
  });

  it('should trigger the quick add button and dispatch addWeight', async () => {
    let addedWeight: WeightTracker;
    let addCallback: () => void;

    const addMock = vi.fn((weight: WeightTracker, callback: () => void) => {
      addedWeight = weight;
      addCallback = callback;
    });

    const { getByRole } = render(WeightTrackerComponent, { ...mockData, onAddWeight: addMock });

    const amountInput = getByRole('spinbutton', { name: 'amount' });
    await fireEvent.input(amountInput, { target: { value: 72 } });

    const quickAddButton = getByRole('button', { name: 'add' });
    await fireEvent.click(quickAddButton);
    await tick();

    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addedWeight).toEqual({
      amount: 72,
      added: getDateAsStr(new Date()),
      target: undefined
    });
  });

  it('should trigger the edit button and dispatch updateWeight', async () => {
    let updatedWeight: WeightTracker;
    let updateCallback: () => void;

    const updateMock = vi.fn((weight: WeightTracker, callback: () => void) => {
      updatedWeight = weight;
      updateCallback = callback;
    });

    const { getByText } = render(WeightTrackerComponent, { ...mockData, onUpdateWeight: updateMock });

    const updateWeightButton = getByText('Edit');
    expect(updateWeightButton).toBeTruthy();
    await fireEvent.click(updateWeightButton);
    await tick();

    // TODO edit and delete is currently not implemented
    expect(skeleton.getModalStore().trigger).toHaveBeenCalledTimes(0);
    /*    
      expect(skeleton.getModalStore().trigger).toHaveBeenCalledWith({
        type: 'component',
        component: 'weightModal',
        response: expect.any(Function),
        meta: {
          weightList: mockData.weightList
        }
      });
  
      const callback = extractModalStoreMockTriggerCallback();
  
      await callback(undefined);
      await tick();
  
      expect(updateMock).toHaveBeenCalledTimes(0);
  
      const callbackDetails = {
        id: 1,
        added: getDateAsStr(new Date()),
        amount: 71
      };
  
      const callbackParams = {
        detail: {
          type: 'update',
          detail: callbackDetails
        }
      };
  
      await callback(callbackParams);
  
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updatedWeight).toEqual(callbackDetails);
      */
  });

  it('should trigger the edit button and dispatch deleteWeight', async () => {
    let deletedWeight: WeightTracker;
    let deleteCallback: () => void;

    const deleteMock = vi.fn((weight: WeightTracker, callback: () => void) => {
      deletedWeight = weight;
      deleteCallback = callback;
    });

    const { getByText } = render(WeightTrackerComponent, { ...mockData, onDeleteWeight: deleteMock });

    const updateWeightButton = getByText('Edit');
    expect(updateWeightButton).toBeTruthy();
    await fireEvent.click(updateWeightButton);
    await tick();

    // TODO edit and delete is currently not implemented
    expect(skeleton.getModalStore().trigger).toHaveBeenCalledTimes(0);

    /*
        const callback = extractModalStoreMockTriggerCallback();
        await callback(undefined);
        await tick();
    
        expect(deleteMock).toHaveBeenCalledTimes(0);
    
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
    
        expect(deleteMock).toHaveBeenCalledTimes(1);
        expect(dispatchEvent).toEqual(callbackDetails);
        */
  });
});
