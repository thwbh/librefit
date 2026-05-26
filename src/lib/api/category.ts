import type { FoodCategory } from '$lib/api/gen';
import { BowlFood, Coffee, Cookie, ForkKnife, IceCream, PintGlass } from 'phosphor-svelte';
import type { Component } from 'svelte';

const categoryIcons: Record<string, Component> = {
	b: Coffee,
	l: BowlFood,
	d: ForkKnife,
	s: Cookie,
	t: IceCream,
	u: PintGlass
};

export const getFoodCategoryLongvalue = (
	foodCategories: Array<FoodCategory>,
	shortvalue: string
): string => {
	return foodCategories.filter((fc) => fc.shortvalue === shortvalue)[0].longvalue;
};

export const getFoodCategoryIcon = (shortvalue: string): Component => {
	return categoryIcons[shortvalue];
};

/**
 * Pick the default intake category for a given local-time hour, per
 * `intake-tracking` scenarios [IT-006..IT-009], [IT-028], [IT-029].
 *
 * Windows:
 *   05:00 – 10:59 → Breakfast ('b')
 *   11:00 – 14:59 → Lunch     ('l')
 *   15:00 – 20:59 → Dinner    ('d')
 *   else          → Snack     ('s')
 */
export const defaultCategoryForHour = (hour: number): string => {
	if (hour >= 5 && hour <= 10) return 'b';
	if (hour >= 11 && hour <= 14) return 'l';
	if (hour >= 15 && hour <= 20) return 'd';
	return 's';
};

export const defaultCategoryForDate = (date: Date): string =>
	defaultCategoryForHour(date.getHours());
