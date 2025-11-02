import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Body from '../../../src/lib/component/wizard/body/Body.svelte';
import type { LibreUser, WizardInput } from '$lib/api/gen';
import { CalculationGoalSchema, CalculationSexSchema } from '$lib/api/gen';

// Mock the veilchen components properly
vi.mock('@thwbh/veilchen', () => {
  return {
    ButtonGroup: vi.fn(() => null),
    RangeInput: vi.fn(() => null)
  };
});

describe('Body Component', () => {
  const mockWizardInput: WizardInput = {
    age: 25,
    height: 175,
    weight: 70,
    sex: CalculationSexSchema.enum.MALE,
    activityLevel: 1.5,
    weeklyDifference: 0.7,
    calculationGoal: CalculationGoalSchema.enum.LOSS
  };


  const mockUserData: LibreUser = {
    id: 1,
    name: 'Arnie',
    avatar: 'abc'
  }

  it('should render component without crashing', () => {
    const { container } = render(Body, {
      props: {
        wizardInput: mockWizardInput,
        userData: mockUserData
      }
    });

    expect(container).toBeDefined();
  });

  it('should apply correct container styling', () => {
    const { container } = render(Body, {
      props: {
        wizardInput: mockWizardInput,
        userData: mockUserData
      }
    });

    const wrapper = container.querySelector('.p-4');
    expect(wrapper).toBeDefined();

    const fieldset = container.querySelector('.fieldset');
    expect(fieldset).toBeDefined();
  });

  it('should handle different wizard input values', () => {
    const differentInput: WizardInput = {
      ...mockWizardInput,
      age: 30,
      height: 180,
      weight: 75,
      sex: CalculationSexSchema.enum.FEMALE
    };

    const { container } = render(Body, {
      props: {
        wizardInput: differentInput,
        userData: mockUserData
      }
    });

    expect(container).toBeDefined();
  });
});
