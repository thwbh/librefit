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
