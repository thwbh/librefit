import { describe, expect, it } from 'vitest';
import type { CalorieTracker, FoodCategory } from '$lib/model';
import { getAverageCategoryIntake, getAverageDailyIntake } from '$lib/calorie-util';

describe('getAverageCategoryIntake', () => {
  it('should return a map of average daily intake per category', async () => {
    const entries: Array<CalorieTracker> = [
      { id: 1, category: 'f', amount: 100, added: '2024-01-01' },
      { id: 2, category: 'v', amount: 200, added: '2024-01-01' },
      { id: 3, category: 'f', amount: 50, added: '2024-01-02' },
      { id: 4, category: 'd', amount: 150, added: '2024-01-01' }
    ];
    const foodCategories: Array<FoodCategory> = [
      { shortvalue: 'f', longvalue: 'fruit' },
      { shortvalue: 'v', longvalue: 'vegetables' },
      { shortvalue: 'd', longvalue: 'dairy' }
    ];

    const result = getAverageCategoryIntake(entries, foodCategories);

    // Verify the function returns correct value
    expect(result.get('f')).toBe(75);
    expect(result.get('v')).toBe(100);
    expect(result.get('d')).toBe(75);
  });

  it('should return null if no entries', () => {
    const result = getAverageCategoryIntake([], []);
    expect(result).toBeNull();
  });
});

describe('getAverageDailyIntake', () => {
  it('should return average daily intake from a list of entries', async () => {
    const entries: Array<CalorieTracker> = [
      { id: 1, amount: 100, added: '2024-01-01', category: 'a' },
      { id: 2, amount: 200, added: '2024-01-01', category: 'b' },
      { id: 3, amount: 50, added: '2024-01-02', category: 'c' },
      { id: 4, amount: 150, added: '2024-01-03', category: 'd' }
    ];

    const result = getAverageDailyIntake(entries);

    // sum / 3 (rounded)
    expect(result).toBe(167);
  });

  it('should return 0 if no entries', () => {
    const result = getAverageDailyIntake([]);
    expect(result).toBe(0);
  });

  it('should return 0 if all entries have 0 amount', () => {
    const entries: Array<CalorieTracker> = [
      { id: 1, category: 'a', amount: 0, added: '2024-01-01' },
      { id: 2, category: 'b', amount: 0, added: '2024-01-02' }
    ];
    const result = getAverageDailyIntake(entries);
    expect(result).toBe(0);
  });
});
