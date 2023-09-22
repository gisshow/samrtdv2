import {
  isValidLoginDatabaseFromLocalStorage,
  isValidUserNameAndPassword,
  saveTokenToLocalStorage,
} from '@/utils/login';
import { useEffect } from 'react';
import { Form, Input, Button, Icon } from 'antd';
import backgroundImage from '@/assets/loginBackground.png';
import logoImage from '../header/img/logo.png';
const { Item } = Form;
function Index(props) {
  const { setIsLogin } = props;
  const { form } = props;
  const { getFieldDecorator } = form;
  useEffect(
    function() {
      async function fetchData() {
        const isValid = await isValidLoginDatabaseFromLocalStorage();
        if (isValid === true) {
          setIsLogin(true);
        }
      }
      fetchData();
    },
    [], // eslint-disable-line
  );
  function onSubmit(event) {
    event.preventDefault();
    form.validateFields(async function(error, values) {
      if (error) {
        return;
      }
      console.log('values', values);
      const { userName, password } = values;
      const ajax_data = await isValidUserNameAndPassword({ userName, password });
      if (ajax_data) {
        setIsLogin(true);
        saveTokenToLocalStorage(ajax_data);
      } else {
        form.setFieldsValue({ userName: undefined, password: undefined });
      }
    });
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        top: '0',
        height: '100%',
        width: '100%',
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: '480px',
          height: '360px',
          background: '#eff4fe',
          padding: '48px',
          borderRadius: '16px',
          display: 'grid',
          alignItems: 'center',
          gap: '24px',
          border: '4px solid',
          boxShadow: '0 2px 16px 2px rgb(0 0 0 / 16%)',
        }}
      >
        <div
          style={{
            backgroundImage: `url(${logoImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            width: '100%',
            height: '48px',
          }}
        ></div>
        <Form onSubmit={onSubmit}>
          <Item>
            {getFieldDecorator('userName', {
              rules: [{ required: true, message: '请输入用户名' }],
            })(
              <Input
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="用户名"
              ></Input>,
            )}
          </Item>
          <Item>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: '请输入密码' }],
            })(
              <Input
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                type="password"
                placeholder="密码"
              ></Input>,
            )}
          </Item>
          <Item style={{ textAlign: 'center', margin: 0 }}>
            <Button type="primary" htmlType="submit">
              登录
            </Button>
          </Item>
        </Form>
      </div>
    </div>
  );
}
export default Form.create()(Index);
