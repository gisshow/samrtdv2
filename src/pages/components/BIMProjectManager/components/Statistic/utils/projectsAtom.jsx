import { geoJSONDataAtom } from './geoJSONDataAtom';
import { computeProjectLocation } from './computeProjectLocation';
import { atomWithRefresh } from './atomWithRefresh';
import sleep from 'sleep-promise';
import { atom } from 'jotai';
import axios from 'axios';
/**
 * 存储所有项目
 */
export const projectsAtom = atomWithRefresh(async function(get) {
  const projects = await getProjects();
  if (projects === undefined) {
    return;
  }
  const geoJSONData = get(geoJSONDataAtom);
  if (geoJSONData === undefined) {
    return;
  }
  for (let key in projects) {
    const project = projects[key];
    // 带上elementID，便于飞往项目
    if (project.elementID === undefined) {
      project.elementID = key;
    }
    // 带上行政区
    if (!project.projectLocation) {
      const { longitude, latitude } = project;
      const { features } = geoJSONData;
      project.projectLocation = computeProjectLocation({ longitude, latitude, features });
      // 存储行政区到服务器
      axios({
        method: 'POST',
        url: '/gws/project/update',
        data: {
          id: project.id,
          projectLocation: project.projectLocation,
        },
      });
    }
  }
  // console.log('changed');
  return Object.values(projects);
});
/**
 * 获取所有项目列表
 * @param {number} [options.interval = 2000] 轮询间隔的时间
 * @returns object 所有项目
 */
async function getProjects({ interval = 2000 } = {}) {
  while (window.BIMProject === undefined || window.BIMProject.projectsAdded !== true) {
    await sleep(interval);
  }
  return window.BIMProject.projects;
}
/**
 * 所有项目里的行政区
 */
export const projectLocationsAtom = atom(function(get) {
  return Array.from(
    new Set(
      get(projectsAtom).map(function({ projectLocation }) {
        return projectLocation;
      }),
    ),
  );
});
/**
 * 所有项目里的项目分类
 */
export const projectTypesAtom = atom(function(get) {
  return Array.from(
    new Set(
      get(projectsAtom).map(function({ projectType }) {
        return projectType;
      }),
    ),
  );
});
