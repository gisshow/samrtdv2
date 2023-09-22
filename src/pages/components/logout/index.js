import { logout } from '@/utils/login';
import { Icon } from 'antd';
export default function Index(props) {
  function onClick(event) {
    logout();
    window.location.reload();
  }
  return (
    <div
      style={{
        position: 'absolute',
        right: '4px',
        top: '16px',
        fontSize: '32px',
        zIndex: '2',
        cursor: 'pointer',
      }}
      onClick={onClick}
      title="退出登录"
    >
      <Icon type="user"></Icon>
    </div>
  );
}
