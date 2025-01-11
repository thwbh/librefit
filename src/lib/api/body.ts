import type { BodyData, CalculationSex } from '$lib/model';
import { invoke } from '@tauri-apps/api/core';

export const setBodyData = async (age: number, sex: CalculationSex, height: number, weight: number): Promise<BodyData> => {
  return invoke('update_body_data', {
    age: +age,
    sex: sex,
    height: +height,
    weight: +weight
  });
};
