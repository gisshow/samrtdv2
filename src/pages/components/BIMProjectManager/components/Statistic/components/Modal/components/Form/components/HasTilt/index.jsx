import { atom, useAtom } from 'jotai';
import { Checkbox } from 'antd';
export const hasTiltAtom = atom(); // 只显示有倾斜
export default function Index() {
  const [hasTilt, setHasTilt] = useAtom(hasTiltAtom);
  return (
    <Checkbox defaultChecked={hasTilt} onChange={event => setHasTilt(event.target.checked)}>
      只显示有倾斜
    </Checkbox>
  );
}
