import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import WeightTrackerComponent from '$lib/components/tracker/WeightTrackerComponent.svelte';
import { tick } from 'svelte';
import * as skeleton from '@skeletonlabs/skeleton';
import { extractModalStoreMockTriggerCallback } from '../../__mocks__/skeletonProxy';
import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';

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
    const { component, getByRole } = render(WeightTrackerComponent);

    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });
    component.$on('addWeight', dispatchMock);

    const amountInput = getByRole('spinbutton', { name: 'amount' });
    await fireEvent.input(amountInput, { target: { value: 72 } });

    const quickAddButton = getByRole('button', { name: 'add' });
    await fireEvent.click(quickAddButton);
    await tick();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toEqual({
      callback: expect.any(Function),
      value: 72,
      dateStr: getDateAsStr(new Date()),
      target: undefined
    });
  });

  it('should trigger the edit button and dispatch updateWeight', async () => {
    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });

    const { component, getByText } = render(WeightTrackerComponent, mockData);

    component.$on('updateWeight', dispatchMock);

    const updateWeightButton = getByText('Edit');
    expect(updateWeightButton).toBeTruthy();
    await fireEvent.click(updateWeightButton);
    await tick();

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

    expect(dispatchMock).toHaveBeenCalledTimes(0);

    const callbackDetails = {
      id: 1,
      dateStr: getDateAsStr(new Date()),
      value: 71
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

  it('should trigger the edit button and dispatch deleteWeight', async () => {
    let dispatchEvent: any;
    const dispatchMock = vi.fn((e) => {
      dispatchEvent = e.detail;
    });

    const { component, getByText } = render(WeightTrackerComponent, mockData);

    component.$on('deleteWeight', dispatchMock);

    const updateWeightButton = getByText('Edit');
    expect(updateWeightButton).toBeTruthy();
    await fireEvent.click(updateWeightButton);
    await tick();

    const callback = extractModalStoreMockTriggerCallback();
    await callback(undefined);
    await tick();

    expect(dispatchMock).toHaveBeenCalledTimes(0);

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
