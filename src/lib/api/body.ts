import type { BodyData } from '$lib/model';
import { invoke } from '@tauri-apps/api/core';

export const updateBodyData = async (bodyData: BodyData): Promise<BodyData> => {
	return invoke('set_body_data', { bodyData });
};
