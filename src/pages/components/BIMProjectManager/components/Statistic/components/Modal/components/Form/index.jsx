// 组件库
import Radio from './components/Radio';
import HasModel from './components/HasModel';
import HasTilt from './components/HasTilt';
import HasProjectCode from './components/HasProjectCode';
import { Form } from 'antd';
// 组件
const { Item } = Form;
export default function Index() {
  return (
    <Form layout="inline" style={{ padding: '8px 0' }}>
      <Item>
        {/* 全部 或 按行政区 */}
        <Radio></Radio>
        {/* 只显示有模型 */}
        <HasModel></HasModel>
        {/* 只显示有倾斜 */}
        {/* <HasTilt></HasTilt> */}
        {/* 只显示有项目编码 */}
        {/* <HasProjectCode></HasProjectCode> */}
      </Item>
    </Form>
  );
}
