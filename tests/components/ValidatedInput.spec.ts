import { render, fireEvent, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach, vi } from 'vitest';
import ValidatedInput from '$lib/components/ValidatedInput.svelte';

const props = {
  value: '',
  type: 'text',
  name: 'email',
  label: 'Email Label',
  placeholder: 'Email placeholder',
  required: true
};

const propsDetail = {
  value: 0,
  name: 'count',
  type: 'number',
  label: 'Count Label',
  placeholder: 'Count placeholder',
  required: true,
  validateDetail: vi.fn((e) => {
    if (e.value <= 0) {
      return {
        valid: false,
        errorMessage: 'Invalid value'
      };
    }

    return {
      valid: true
    };
  })
};

/**
 * @vitest-environment jsdom
 */
describe('ValidatedInput.svelte', () => {
  afterEach(() => cleanup());

  it('renders correctly', () => {
    const props = {
      value: 'username',
      type: 'text',
      name: 'username',
      label: 'Username label',
      placeholder: 'Enter Username',
      required: true
    };

    const { getByLabelText } = render(ValidatedInput, { props });

    const label = getByLabelText(props.label);
    expect(label).toBeTruthy();

    const input = screen.getByPlaceholderText(props.placeholder);
    expect(input['value']).toBe(props.value);
  });

  it('validates non-empty required input correctly', async () => {
    const { component, getByLabelText } = render(ValidatedInput, { props });

    let input = getByLabelText(props.label);
    await fireEvent.input(input, { target: { value: 'email@example.com' } });

    expect(await component.validate()).toBe(true);
    expect(component.errorMessage).toBeUndefined();
  });

  it('validates empty required input correctly', async () => {
    const { component, getByLabelText } = render(ValidatedInput, { props });

    let input = getByLabelText(props.label);
    await fireEvent.input(input, { target: { value: '' } });

    expect(await component.validate()).toBe(false);
    expect(component.errorMessage).toEqual(component.emptyMessage);
  });

  it('validates required input correctly with details', async () => {
    const { component, getByLabelText } = render(ValidatedInput, { ...propsDetail });

    let input = getByLabelText(propsDetail.label);
    await fireEvent.input(input, { target: { value: -1 } });

    expect(await component.validate()).toBe(false);
    expect(component.validateDetail).toHaveBeenCalledTimes(1);
    expect(component.errorMessage).toEqual('Invalid value');
  });
});
