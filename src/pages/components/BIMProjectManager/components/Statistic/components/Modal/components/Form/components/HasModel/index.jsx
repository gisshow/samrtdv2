import { atom, useAtom } from 'jotai';
import { Checkbox } from 'antd';
export const hasModelAtom = atom(); // 只显示有模型
export default function Index() {
  const [hasModel, setHasModel] = useAtom(hasModelAtom);
  return (
    <Checkbox defaultChecked={hasModel} onChange={event => setHasModel(event.target.checked)}>
      只显示有模型
    </Checkbox>
  );
}
