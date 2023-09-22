import { useState, useEffect } from 'react';
import styles from './index.less';
import { Input, Form, Row, Col, Select, Icon, Button } from 'antd';
import proj4 from 'proj4';
const { Item } = Form;
const { Option } = Select;
function IndexPage(props) {
  const [dataBase, setDataBase] = useState({
    from: 'EPSG:4547',
    to: 'EPSG:4490',
    list: ['EPSG:4547', 'EPSG:4490', 'EPSG:3857', 'EPSG:4326'],
  });
  const { form, parentState } = props;
  const { getFieldDecorator } = form;
  useEffect(
    function() {
      parentState.dataBase.title = `坐标转换（${dataBase.from} => ${dataBase.to}）`;
      parentState.setDataBase({ ...parentState.dataBase });
    },
    [dataBase.from, dataBase.to], // eslint-disable-line
  );
  // 选择源
  function onSelectFrom(value) {
    dataBase.from = value;
    setDataBase({ ...dataBase });
  }
  // 选择目标
  function onSelectTo(value) {
    dataBase.to = value;
    setDataBase({ ...dataBase });
  }
  // 点击“交换”按钮
  function onClick(event) {
    const from = dataBase.from;
    const to = dataBase.to;
    dataBase.from = to;
    dataBase.to = from;
    setDataBase({ ...dataBase });
    form.setFieldsValue({ from: to, to: from });
  }
  return (
    <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} className={styles.container}>
      <Row gutter={24}>
        <Col span={10}>
          <Item labelCol={{ span: 0 }} wrapperCol={{ span: 24 }}>
            {getFieldDecorator('from', { initialValue: dataBase.from })(
              <Select size="large" onSelect={onSelectFrom}>
                {dataBase.list.map(function(name, index) {
                  return (
                    <Option value={name} key={index} size="large">
                      {name}
                    </Option>
                  );
                })}
              </Select>,
            )}
          </Item>
        </Col>
        <Col span={4}>
          <Icon
            type="swap"
            style={{ color: 'white', fontSize: '40px', width: '100%', cursor: 'pointer' }}
            title="交换"
            onClick={onClick}
          />
        </Col>
        <Col span={10}>
          <Item labelCol={{ span: 0 }} wrapperCol={{ span: 24 }}>
            {getFieldDecorator('to', { initialValue: dataBase.to })(
              <Select size="large" onSelect={onSelectTo}>
                {dataBase.list.map(function(name, index) {
                  return (
                    <Option value={name} key={index}>
                      {name}
                    </Option>
                  );
                })}
              </Select>,
            )}
          </Item>
        </Col>
      </Row>
      <Item label="横坐标">
        {getFieldDecorator('longitude')(
          <Input
            size="large"
            placeholder={`请输入${dataBase.from}横坐标`}
            allowClear={true}
          ></Input>,
        )}
      </Item>
      <Item label="纵坐标">
        {getFieldDecorator('latitude')(
          <Input
            size="large"
            placeholder={`请输入${dataBase.from}纵坐标`}
            allowClear={true}
          ></Input>,
        )}
      </Item>
      <Item wrapperCol={{ span: 24 }}>
        {getFieldDecorator('result')(
          <Input size="large" disabled={true} placeholder={`所得到的${dataBase.to}坐标`}></Input>,
        )}
      </Item>
    </Form>
  );
}
function onValuesChange(props, changedValues, allValues) {
  // console.log('allValues', props, changedValues, allValues);
  const { result } = changedValues;
  if (result) {
    return;
  }
  let { longitude, latitude, from, to } = allValues;
  if (isValidCoordinate(longitude, latitude) === false) {
    return;
  }
  longitude = parseFloat(longitude);
  latitude = parseFloat(latitude);
  const [_longitude, _latitude] = proj4(from, to, [longitude, latitude]);
  props.form.setFieldsValue({ result: `${_longitude},${_latitude}` });
}
function isValidCoordinate(longitude, latitude) {
  if (longitude === undefined) {
    return false;
  }
  if (latitude === undefined) {
    return false;
  }
  longitude = parseFloat(longitude);
  if (isNaN(longitude)) {
    return false;
  }
  latitude = parseFloat(latitude);
  if (isNaN(latitude)) {
    return false;
  }
  return true;
}
// console.log('proj4', proj4);
proj4.defs(
  'EPSG:4547',
  '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs',
);
proj4.defs('EPSG:4490', '+proj=longlat +ellps=GRS80 +no_defs +type=crs');
export default Form.create({ onValuesChange })(IndexPage);
