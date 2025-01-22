import { invoke } from '@tauri-apps/api/core';
import type { Dashboard, LibreUser } from '../model';
import { getDateAsStr } from '$lib/date';

export const getDashboard = async (date: Date): Promise<Dashboard> => {
  return invoke('daily_dashboard', { dateStr: getDateAsStr(date) });
};

export const getProfile = async (): Promise<LibreUser> => {
  return invoke('get_user');
}

export const updateProfile = async (userData: LibreUser): Promise<LibreUser> => {
  return invoke('update_user', {
    userName: userData.name,
    userAvatar: userData.avatar
  });
};
