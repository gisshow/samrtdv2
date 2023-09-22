import axios from 'axios';

export default async function index() {
  return axios({
    url: '/gws/project/list',
    method: 'POST',
  });
}
