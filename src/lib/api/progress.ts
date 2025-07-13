import type { TrackerProgress } from "$lib/model"
import { invoke } from "@tauri-apps/api/core";

export const getTrackerProgress = (): Promise<TrackerProgress> => {
  return invoke('get_tracker_progress');
} 
