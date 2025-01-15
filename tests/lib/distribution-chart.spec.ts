import { expect, describe, it, vi } from 'vitest';
import { createDistributionChart } from '../../src/lib/distribution-chart';
import type { CalorieTracker } from '../../src/lib/model';

/**
 * @vitest-environment jsdom
 */
describe('createDistributionChart', () => {
  const entry1: CalorieTracker = {
    id: 1,
    amount: 100,
    category: 'fruit',
    added: '2022-01-01',
  };

  const entry2: CalorieTracker = {
    id: 1,
    amount: 100,
    category: 'fruit',
    added: '2022-01-01',
  };

  const foodCategories = [{ shortvalue: 'fruit', longvalue: 'Fruits' }, { shortvalue: 'meat', longvalue: 'Meats' }];

  it('should return an object with chartData and chartOptions for input entries', () => {
    const result = createDistributionChart([entry1, entry2], foodCategories, false);
    expect(result).toHaveProperty('chartData');
    expect(result).toHaveProperty('chartOptions');
  });

  it('should return an object with undefined chartData when no valid average category intakes', () => {
    const result = createDistributionChart([], foodCategories, false);
    expect(result.chartData).toBeUndefined();
    expect(result).toHaveProperty('chartOptions');
  });

  it('should correctly classify and style chart based on dark mode and if history is displayed', () => {
    // Mock getComputedStyle
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: (prop: string) => {
        if (prop === '--color-surface-500') return '255, 255, 255';
        if (prop === '--color-surface-200') return '128, 128, 128';
        if (prop === '--color-primary-500') return '64, 64, 64';
        if (prop === '--color-warning-500') return '32, 32, 32';
        if (prop === '--color-error-500') return '16, 16, 16';
      }
    });

    // check light theme
    document.documentElement.classList.remove('dark');

    let chart = createDistributionChart([entry1, entry2], foodCategories, false);
    let chartDataset = chart.chartData.datasets[0];

    expect(chartDataset.borderColor).toEqual('rgb(128, 128, 128)');

    // check dark theme
    document.documentElement.classList.add('dark');

    chart = createDistributionChart([entry1, entry2], foodCategories, false);
    chartDataset = chart.chartData.datasets[0];

    expect(chartDataset.borderColor).toEqual('rgb(255, 255, 255)');
  });

  it('should return object of correct shape', () => {
    const result = createDistributionChart([entry1, entry2], foodCategories, false);

    // Validate the shape of the returned object
    expect(result).toHaveProperty('chartData.labels');
    expect(result).toHaveProperty('chartData.datasets');
    expect(result).toHaveProperty('chartOptions.plugins');
    expect(result).toHaveProperty('chartOptions.scales');

    // Further assertions can be made on the length and type of properties
    expect(Array.isArray(result.chartData.labels)).toBeTruthy();
    expect(Array.isArray(result.chartData.datasets)).toBeTruthy();
  });
});
