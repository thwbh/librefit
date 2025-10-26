import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';

export const getAvatar = (seed: string): string => {
  return createAvatar(lorelei, {
    seed,
    flip: true,
    glassesProbability: 50,
    hairAccessoriesProbability: 0,
    mouth: [
      'happy01',
      'happy02',
      'happy03',
      'happy04',
      'happy05',
      'happy06',
      'happy07',
      'happy08',
      'happy09',
      'happy10',
      'happy11',
      'happy12',
      'happy13',
      'happy14',
      'happy15',
      'happy16',
      'happy17',
      'happy18'
    ]
  }).toDataUri();
};

export const getAvatarFromUser = (name: string, avatar?: string): string => {
  return getAvatar(avatar || name);
};
