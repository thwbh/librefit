import { Store } from '@tauri-apps/plugin-store';

const store = new Store('settings.json');

export const showHint = async (feat: string) => {
	return false;
};
