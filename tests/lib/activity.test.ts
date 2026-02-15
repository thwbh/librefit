import { describe, it, expect } from 'vitest';
import { activityLevels, getActivityLevelInfo } from '$lib/activity';

describe('activity utilities', () => {
	describe('activityLevels', () => {
		it('should contain 5 activity levels', () => {
			expect(activityLevels).toHaveLength(5);
		});

		it('should have correct levels in ascending order', () => {
			const levels = activityLevels.map((a) => a.level);
			expect(levels).toEqual([1, 1.25, 1.5, 1.75, 2]);
		});

		it('should have unique labels', () => {
			const labels = activityLevels.map((a) => a.label);
			const uniqueLabels = new Set(labels);
			expect(uniqueLabels.size).toBe(activityLevels.length);
		});

		it('should have all required properties', () => {
			activityLevels.forEach((level) => {
				expect(level).toHaveProperty('level');
				expect(level).toHaveProperty('label');
				expect(level).toHaveProperty('icon');
				expect(level).toHaveProperty('badge');
				expect(level).toHaveProperty('description');
			});
		});

		it('should have badge with text and color', () => {
			activityLevels.forEach((level) => {
				expect(level.badge).toHaveProperty('text');
				expect(level.badge).toHaveProperty('color');
				expect(level.badge.text).toMatch(/Level \d/);
			});
		});

		it('should have non-empty descriptions', () => {
			activityLevels.forEach((level) => {
				expect(level.description).toBeTruthy();
				expect(level.description.length).toBeGreaterThan(20);
			});
		});

		it('should have specific labels for each level', () => {
			expect(activityLevels[0].label).toBe('Mostly Sedentary');
			expect(activityLevels[1].label).toBe('Light Activity');
			expect(activityLevels[2].label).toBe('Moderate Activity');
			expect(activityLevels[3].label).toBe('Highly Active');
			expect(activityLevels[4].label).toBe('Athlete');
		});

		it('should have appropriate badge colors', () => {
			expect(activityLevels[0].badge.color).toBe('badge-secondary');
			expect(activityLevels[1].badge.color).toBe('badge-secondary');
			expect(activityLevels[2].badge.color).toBe('badge-secondary');
			expect(activityLevels[3].badge.color).toBe('badge-warning');
			expect(activityLevels[4].badge.color).toBe('badge-accent');
		});
	});

	describe('getActivityLevelInfo', () => {
		it('should return correct info for level 1', () => {
			const info = getActivityLevelInfo(1);

			expect(info.level).toBe(1);
			expect(info.label).toBe('Mostly Sedentary');
		});

		it('should return correct info for level 1.25', () => {
			const info = getActivityLevelInfo(1.25);

			expect(info.level).toBe(1.25);
			expect(info.label).toBe('Light Activity');
		});

		it('should return correct info for level 1.5', () => {
			const info = getActivityLevelInfo(1.5);

			expect(info.level).toBe(1.5);
			expect(info.label).toBe('Moderate Activity');
		});

		it('should return correct info for level 1.75', () => {
			const info = getActivityLevelInfo(1.75);

			expect(info.level).toBe(1.75);
			expect(info.label).toBe('Highly Active');
		});

		it('should return correct info for level 2', () => {
			const info = getActivityLevelInfo(2);

			expect(info.level).toBe(2);
			expect(info.label).toBe('Athlete');
		});

		it('should return first level for invalid/unknown level', () => {
			const info = getActivityLevelInfo(999);

			expect(info.level).toBe(1);
			expect(info.label).toBe('Mostly Sedentary');
		});

		it('should return first level for negative level', () => {
			const info = getActivityLevelInfo(-1);

			expect(info.level).toBe(1);
		});

		it('should return first level for zero', () => {
			const info = getActivityLevelInfo(0);

			expect(info.level).toBe(1);
		});

		it('should return same object reference from activityLevels array', () => {
			const info = getActivityLevelInfo(1.5);
			const expected = activityLevels.find((a) => a.level === 1.5);

			expect(info).toBe(expected);
		});
	});
});
