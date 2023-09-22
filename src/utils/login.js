/**
 * 登录页面
 */
import axios from 'axios';
import qs from 'qs';
let expired = 30 * 60 * 1000; // 过期的时间
let localStorage_key = 'loginDatabase'; // 在localStorage里存储的关键字，对应的值为{token,timestamp}
export async function isValidUserNameAndPassword({ userName, password } = {}) {
  const ajax_response = await axios({
    method: 'POST',
    url: '/gongwushu/user/login',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({ username: userName, password }),
  });
  const { success, data } = ajax_response.data;
  if (success === true) {
    return data;
  }
}
export async function isValidToken(token) {
  const ajax_response = await axios({
    method: 'POST',
    url: '/gws/project/list',
    headers: { token },
  });
  const { success, data } = ajax_response.data;
  if (success === undefined) {
    return false;
  }
  return true;
}
/**
 * 编码成loginDatabase
 * @param {string} token
 * @returns
 */
export function encodeLoginDatabase(token) {
  return window.btoa(
    JSON.stringify({
      token,
      timestamp: new Date().getTime(),
    }),
  );
}
/**
 * 解析loginDatabase
 * @param {string} loginDatabase
 * @returns
 */
export function decodeLoginDatabase(loginDatabase) {
  if (loginDatabase === null) {
    return;
  }
  if (loginDatabase === undefined) {
    return;
  }
  let stored; // 存储的登录权限
  // 存储的登录权限被手动修改后
  try {
    stored = JSON.parse(window.atob(loginDatabase));
  } catch (error) {
    return;
  }
  return stored;
}
export function saveLoginDatabaseToLocalStorage(loginDatabase) {
  window.localStorage.setItem(localStorage_key, loginDatabase);
}
export function getLoginDatabaseFromLocalStorage() {
  return window.localStorage.getItem(localStorage_key);
}
export function saveTokenToLocalStorage(token) {
  saveLoginDatabaseToLocalStorage(encodeLoginDatabase(token));
  window.localStorage.setItem('token', token); // 兼容widget里的token获取方式
}
export function logout() {
  window.localStorage.removeItem(localStorage_key);
}
export function getTokenFromLocalStorage() {
  const loginDatabase = decodeLoginDatabase(getLoginDatabaseFromLocalStorage());
  if (loginDatabase === undefined) {
    return;
  }
  const { token } = loginDatabase;
  return token;
}
export async function isValidLoginDatabase(loginDatabase) {
  let stored = decodeLoginDatabase(loginDatabase);
  if (stored === undefined) {
    return false;
  }
  const { token, timestamp } = stored;
  // 权限存在过期时间
  if (expired) {
    if (timestamp === undefined) {
      return false;
    }
    const now = new Date().getTime();
    // 存储的时间大于当前时间时，避免手动修改，避免永久权限。
    if (timestamp > now) {
      return false;
    }
    if (now - timestamp > expired) {
      return false;
    }
  }
  return await isValidToken(token);
}
export async function isValidLoginDatabaseFromLocalStorage() {
  // return true; // 跳过登录
  return await isValidLoginDatabase(getLoginDatabaseFromLocalStorage());
}
