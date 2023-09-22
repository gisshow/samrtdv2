import { PUBLIC_PATH } from '@/utils/config'

export const data = [
  {
    id: 1,
    name: '机位001',
    online: true,
    hierarchy: [
      113.93115620819615, 22.53904757162454, 0,
      113.93217959796775, 22.539100820128926, 0,
      113.93205008, 22.53851706, 0,
      113.93132504, 22.53852806, 0,
    ],
    rotation: -0.09,
    url: `${PUBLIC_PATH}media/sci.mp4`,
  },
  {
    id: 2,
    name: '机位002',
    online: false,
    hierarchy: [
      113.93415620819615, 22.53904757162454, 0,
      113.93517959796775, 22.539100820128926, 0,
      113.93505008, 22.53851706, 0,
      113.93432504, 22.53852806, 0,
    ],
    rotation: -0.09,
    url: `${PUBLIC_PATH}media/sci.mp4`,
  },
];
