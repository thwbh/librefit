import { getBodyData, getUser } from '$lib/api/gen';
import type { PageLoad } from '../$types';

export const load: PageLoad = async () => {
  return {
    userProfile: await getUser(),
    bodyData: await getBodyData()
  }
}
