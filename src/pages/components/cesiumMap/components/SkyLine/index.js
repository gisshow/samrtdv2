/* global mars3d */
import { useEffect, useState } from 'react';
import BorderPoint from '@/pages/components/border-point';
import { Icon } from 'antd';
import { Row, Col } from 'antd';
import { Slider, InputNumber } from 'antd';
import styles from './style.less';

export default function IndexPage(props) {
  const { viewer } = props;
  const [skylineWidth, setSkylineWidth] = useState(); // 天际线宽
  useEffect(
    function() {
      viewer.scene.skyline = new mars3d.analysi.Skyline(viewer);
      setSkylineWidth(viewer.scene.skyline.tjxWidth);
      return function() {
        viewer.scene.skyline.destroy();
      };
    },
    [], // eslint-disable-line
  );
  function closePanel() {
    console.log('props', props);
    props.dispatch({
      type: 'Map/setToolsActiveKey',
      payload: '',
    });
  }
  function changeSkylineWidth(value) {
    console.log('changeSkylineWidth', value);
    viewer.scene.skyline.tjxWidth = value;
    setSkylineWidth(value);
  }
  return (
    <div className={styles.PipePanel}>
      <BorderPoint />
      <div className={styles.closeV} onClick={closePanel}>
        <Icon type="close" />
      </div>
      <Row>
        <Col span={6}>天际线宽：</Col>
        <Col span={18}>
          <Row>
            <Col span={16}>
              <Slider min={1} max={10} onChange={changeSkylineWidth} value={skylineWidth}></Slider>
            </Col>
            <Col span={8}>
              <InputNumber
                min={1}
                max={10}
                onChange={changeSkylineWidth}
                style={{ marginLeft: '16px' }}
                value={skylineWidth}
              ></InputNumber>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
