import type { FoodCategory } from '$lib/model';
import { invoke } from '@tauri-apps/api/core';

export const getFoodCategories = (): Promise<Array<FoodCategory>> => {
	return invoke('get_food_categories');
};
