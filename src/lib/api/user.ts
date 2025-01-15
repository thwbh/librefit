import { invoke } from '@tauri-apps/api/core';
import type { LibreUser } from '../model';

export const updateProfile = async (userData: LibreUser): Promise<LibreUser> => {
	return invoke('update_user', {
		userName: userData.name,
		userAvatar: userData.avatar
	});
};
