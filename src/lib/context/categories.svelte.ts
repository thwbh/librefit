/**
 * Food Categories Context
 *
 * Provides static food categories to all components without prop drilling.
 * Categories are loaded once at layout level and remain constant during the session.
 */

import { getContext, setContext } from 'svelte';
import type { FoodCategory } from '$lib/api/gen';

const CATEGORIES_CONTEXT_KEY = Symbol('food-categories');

export function setCategoriesContext(categories: FoodCategory[]) {
	setContext(CATEGORIES_CONTEXT_KEY, categories);
}

export function getCategoriesContext(): FoodCategory[] {
	const categories = getContext<FoodCategory[]>(CATEGORIES_CONTEXT_KEY);

	if (!categories) {
		throw new Error(
			'Food categories context not found. Make sure setCategoriesContext() is called in a parent component.'
		);
	}

	return categories;
}

/**
 * Optional: Get categories context without throwing if not found
 * Useful for components that work with or without category data
 */
export function tryGetCategoriesContext(): FoodCategory[] | null {
	return getContext<FoodCategory[] | null>(CATEGORIES_CONTEXT_KEY) ?? null;
}

/**
 * Helper: Get category by shortvalue (code)
 */
export function getCategoryByCode(code: string): FoodCategory | undefined {
	const categories = getCategoriesContext();
	return categories.find((cat) => cat.shortvalue === code);
}
