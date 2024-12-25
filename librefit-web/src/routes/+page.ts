import type { LibreUser } from "$lib/model";
import { invoke } from "@tauri-apps/api/core";

export const load = async (): Promise<{ userData: LibreUser }> => {
  const user: Promise<LibreUser> = invoke('get_user');

  return {
    userData: await user
  };
};
