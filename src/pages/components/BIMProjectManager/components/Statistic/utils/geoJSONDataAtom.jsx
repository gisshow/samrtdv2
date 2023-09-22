import axios from 'axios';
import { PUBLIC_PATH } from '@/utils/config';
import { atom } from 'jotai';
import { atomWithRefresh } from './atomWithRefresh';
export const geoJSONURLAtom = atom(PUBLIC_PATH + 'config/api/shenzhen.geojson');
export const geoJSONDataAtom = atomWithRefresh(async function(get) {
  const url = get(geoJSONURLAtom);
  try {
    const { data } = await axios({
      url,
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.error(error);
    return;
  }
});
