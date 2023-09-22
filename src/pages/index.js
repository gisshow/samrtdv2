/**
 * 带有登录的主页
 */
import { useState } from 'react';
import Home from './_index'; // 未带登录的主页
import Login from '@/pages/components/login';
import Logout from '@/pages/components/logout';
export default function Index(props = {}) {
  const [isLogin, setIsLogin] = useState(true);// 后期需要改回来
  if (isLogin) {
    return (
      <>
        <Home {...props} setIsLogin={setIsLogin}></Home>
        {/* <Logout setIsLogin={setIsLogin}></Logout> */}
      </>
    );
  }
  return <Login setIsLogin={setIsLogin}></Login>;
}
