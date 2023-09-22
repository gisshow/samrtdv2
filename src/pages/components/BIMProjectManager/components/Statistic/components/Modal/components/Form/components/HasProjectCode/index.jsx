import { atom, useAtom } from 'jotai';
import { Checkbox } from 'antd';
export const hasProjectCodeAtom = atom(); // 只显示有项目编码
export default function Index() {
  const [hasProjectCode, setHasProjectCode] = useAtom(hasProjectCodeAtom);
  return (
    <Checkbox
      defaultChecked={hasProjectCode}
      onChange={event => setHasProjectCode(event.target.checked)}
    >
      只显示有项目编码
    </Checkbox>
  );
}
