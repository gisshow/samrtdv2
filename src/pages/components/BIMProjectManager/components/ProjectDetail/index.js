/* global $ */
import { getTokenFromLocalStorage } from '@/utils/login';
import { getProjectID } from '@/utils/bimProject';
import {
  getGeojsonPathAndCached,
  addProjectRedline,
  destroyProjectRedline,
} from '@/utils/bimProject';
import { destoryProjectLimitHeight, addProjectLimitHeight } from '@/utils/bimProject';
import axios from 'axios';
import { useEffect } from 'react';
import { useState } from 'react';
import styles from './style.less';
import BorderPoint from '../../../border-point';
import { Icon } from 'antd';
import { Row, Col } from 'antd';
import { Button } from 'antd';
import { Switch } from 'antd';
import { Checkbox } from 'antd';
import { Form, Input, Select } from 'antd';
import { Upload } from 'antd';
import Embed from './components/Embed';
import { geoJSONDataAtom } from '../Statistic/utils/geoJSONDataAtom';
import { computeProjectLocation } from '../Statistic/utils/computeProjectLocation';
import { useAtomValue } from 'jotai';
import { PROJECT_TYPES } from '../Statistic/components/Modal/components/Form/components/Radio/components/ProjectType';
const { Dragger } = Upload;
const { Item } = Form;
const { Option } = Select;
function IndexPage(props) {
  const [disabled, setDisabled] = useState(true);
  const [inputDisabledClassName, setInputDisabledClassName] = useState('input-disabled');
  const { viewer } = props;
  const { form } = props;
  const { getFieldDecorator } = form;
  const { parentThis } = props;
  const {
    project_detail,
    project_limit_height_checked,
    project_detail_id,
    project_redline_checked,
  } = parentThis.state;
  const [formInitialValues, setFormInitialValues] = useState(
    project_detail || {
      projectName: '音乐学院',
      longitude: 120,
      latitude: 21,
      height: 8,
      controlHeight: null,
      geojsonPath: null,
      tiltAddress: null,
      tiltScope: null,
      tiltHeight: null,
      projectCode: null,
      projectType: null,
    },
  );
  const geoJSONData = useAtomValue(geoJSONDataAtom);
  useEffect(
    function() {
      if (project_detail === undefined) {
        return;
      }
      setFormInitialValues(project_detail);
      form.setFieldsValue(project_detail);
    },
    [project_detail], // eslint-disable-line
  );
  function closePanel() {
    console.log('props', props);
    parentThis.setState({
      project_detail_visible: false,
      project_detail_layer_toggle_visible: true,
    });
  }
  function onClickEdit() {
    setDisabled(false);
    setInputDisabledClassName('');
  }
  function onClickFormCancel() {
    setDisabled(true);
    setInputDisabledClassName('input-disabled');
    console.log('form', form);
    form.setFieldsValue(formInitialValues); // 恢复为初始值
  }
  async function onClickFormOk() {
    setDisabled(true);
    setInputDisabledClassName('input-disabled');
    const init = Object.assign({}, formInitialValues);
    const formFieldsValue = form.getFieldsValue();
    // console.log('formFieldsValue', JSON.stringify(formFieldsValue));

    // 替换文件上传red_line为geojsonPath
    const { red_line } = formFieldsValue;
    if (red_line) {
      formFieldsValue.geojsonPath = red_line[0].response.data;
    } else {
      formFieldsValue.geojsonPath = formInitialValues.geojsonPath;
    }
    delete formFieldsValue.red_line;

    // 替换文件上传tiltScopeUpload为tiltScope
    const { tiltScopeUpload } = formFieldsValue;
    if (tiltScopeUpload) {
      formFieldsValue.tiltScope = tiltScopeUpload[0].response.data;
    } else {
      formFieldsValue.tiltScope = formInitialValues.tiltScope;
    }
    delete formFieldsValue.tiltScopeUpload;

    // console.log('formFieldsValue', formFieldsValue);
    const current = Object.assign({}, formFieldsValue);
    setFormInitialValues(current); // 保存为初始值

    const init_id = getProjectID(init.projectName);
    const init_project = window.BIMProject.projects[init_id];
    const { id, url, flatheight } = init_project;
    if (window.BIMProject && window.BIMProject.projects && window.BIMProject.projects[init_id]) {
      Object.assign(current, { id, url, flatheight }); // 补上缺失的id等数据

      current.height = parseFloat(current.height); // 修复海拔高度不是数字
      // 修复控高不是数字
      current.controlHeight = parseFloat(current.controlHeight);
      if (isNaN(current.controlHeight)) {
        current.controlHeight = null;
      }

      // 计算所在区域
      if (
        current.longitude === init.longitude &&
        current.latitude === init.latitude &&
        init.projectLocation
      ) {
        // 经纬度未发生变化时
        current.projectLocation = init.projectLocation;
      } else {
        current.projectLocation = computeProjectLocation({
          longitude: current.longitude,
          latitude: current.latitude,
          features: geoJSONData.features,
        });
      }

      console.log(init, current);
      const current_id = getProjectID(current.projectName);
      window.BIMProject.removeBIMProject(init);
      window.BIMProject.projects[current_id] = current;
      window.BIMProject.addBIMProject(current);

      $('#' + current_id).click();

      // 修复项目详情面板不显示
      parentThis.setState({
        project_detail_visible: true,
      });

      const promises = [];
      // 更新服务器里的数据，只更新部分数据
      promises.push(
        axios({
          method: 'POST',
          url: '/gws/project/update',
          data: {
            id: current.id,
            projectName: current.projectName,
            longitude: current.longitude,
            latitude: current.latitude,
            height: current.height,
            controlHeight: current.controlHeight,
            geojsonPath: current.geojsonPath,
            projectCode: current.projectCode,
            projectType: current.projectType,
            projectLocation: current.projectLocation,
          },
        }),
      );
      // 编辑倾斜，只更新部分数据
      if (current.tiltAddress || current.tiltScope) {
        promises.push(
          axios({
            method: 'POST',
            url: '/gws/project/edit/tilt',
            data: {
              projectId: current.id,
              tiltAddress: current.tiltAddress,
              tiltScope: current.tiltScope,
              tiltHeight: current.tiltHeight,
            },
          }),
        );
      }
      await Promise.all(promises);
    }
  }
  function onClickProjectCompare() {
    parentThis.setState({
      project_compare_visible: true,
    });
  }
  function onClickMapFly() {
    parentThis.setState({
      project_map_fly_visible: true,
    });
  }
  async function onToggleLimitHeight(value) {
    console.log('onToggleLimitHeight', value);
    parentThis.setState({
      project_limit_height_checked: value,
    });
    if (value === false) {
      destoryProjectLimitHeight();
    }
    if (value === true) {
      await addProjectLimitHeight(viewer);
    }
  }
  async function onToggleRedline(value) {
    console.log('onToggleRedline', value);
    const { checked } = value.target;
    // 勾选或取消勾选界面里的“红线”选项
    parentThis.setState({
      project_redline_checked: checked,
    });
    // 根据是否勾选来加载或删除红线
    if (checked === false) {
      destroyProjectRedline(viewer);
    }
    if (checked === true) {
      addProjectRedline(viewer);
    }
  }
  /**
   * 上传文件时
   */
  function normFile(e) {
    console.log('Upload event:', e);
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  }
  return (
    <div className={styles.PipePanel}>
      <BorderPoint />
      <div className={styles.closeV} onClick={closePanel}>
        <Icon type="close" />
      </div>
      <Col>
        <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Row className={styles.title}>
            <Col style={{ display: 'flex', alignItems: 'center' }}>
              <Col span={8}>项目详情</Col>
              <Col span={10}>
                {disabled === true && <Icon type="edit" onClick={onClickEdit} title="编辑"></Icon>}
                {disabled === false && (
                  <Row>
                    <Col span={12} style={{ display: 'flex' }}>
                      <Button onClick={onClickFormCancel}>取消</Button>
                    </Col>
                    <Col span={12} style={{ display: 'flex' }}>
                      <Button
                        onClick={onClickFormOk}
                        type="primary"
                        style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                      >
                        确定
                      </Button>
                    </Col>
                  </Row>
                )}
              </Col>
              <Col
                span={6}
                style={{
                  height: '32px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  userSelect: 'none',
                }}
              >
                <Checkbox checked={project_redline_checked} onChange={onToggleRedline}>
                  <span style={{ color: 'white' }}>红线</span>
                </Checkbox>
              </Col>
            </Col>
          </Row>
          <Row className={styles.body}>
            <Item label="项目名称">
              {getFieldDecorator('projectName', { initialValue: formInitialValues.projectName })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>

            <Item label="项目编码">
              {getFieldDecorator('projectCode', { initialValue: formInitialValues.projectCode })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="项目分类">
              {disabled === true &&
                getFieldDecorator('projectType', {
                  initialValue: formInitialValues.projectType,
                })(
                  <Input
                    disabled={disabled}
                    className={inputDisabledClassName}
                    autoComplete="off"
                  ></Input>,
                )}
              {disabled === false &&
                getFieldDecorator('projectType', {
                  initialValue: formInitialValues.projectType,
                })(
                  <Select>
                    {PROJECT_TYPES.map(function(value, index) {
                      return (
                        <Option value={value} key={index}>
                          {value}
                        </Option>
                      );
                    })}
                  </Select>,
                )}
            </Item>
            <Item label="经度">
              {getFieldDecorator('longitude', { initialValue: formInitialValues.longitude })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="纬度">
              {getFieldDecorator('latitude', { initialValue: formInitialValues.latitude })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="海拔">
              {getFieldDecorator('height', { initialValue: formInitialValues.height })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="控高">
              {getFieldDecorator('controlHeight', {
                initialValue: formInitialValues.controlHeight,
              })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="红线范围">
              {disabled === true &&
                getFieldDecorator('geojsonPath', { initialValue: formInitialValues.geojsonPath })(
                  <Input
                    disabled={disabled}
                    className={inputDisabledClassName}
                    autoComplete="off"
                  ></Input>,
                )}
              {disabled === false &&
                getFieldDecorator('red_line', {
                  valuePropName: 'fileList',
                  getValueFromEvent: normFile,
                })(
                  <Dragger
                    name="file"
                    action="/gws/project/upload"
                    headers={{
                      token: getTokenFromLocalStorage(),
                    }}
                    accept=".geojson,.json"
                  >
                    <p className="ant-upload-drag-icon">
                      <Icon type="inbox" />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域以上传文件</p>
                    <p className="ant-upload-hint">仅支持.geojson和.json格式</p>
                  </Dragger>,
                )}
            </Item>
            <Item label="倾斜地址">
              {getFieldDecorator('tiltAddress', { initialValue: formInitialValues.tiltAddress })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
            <Item label="倾斜范围">
              {disabled === true &&
                getFieldDecorator('tiltScope', { initialValue: formInitialValues.tiltScope })(
                  <Input
                    disabled={disabled}
                    className={inputDisabledClassName}
                    autoComplete="off"
                  ></Input>,
                )}
              {disabled === false &&
                getFieldDecorator('tiltScopeUpload', {
                  valuePropName: 'fileList',
                  getValueFromEvent: normFile,
                })(
                  <Dragger
                    name="file"
                    action="/gws/project/upload"
                    headers={{
                      token: getTokenFromLocalStorage(),
                    }}
                    accept=".geojson,.json"
                  >
                    <p className="ant-upload-drag-icon">
                      <Icon type="inbox" />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域以上传文件</p>
                    <p className="ant-upload-hint">仅支持.geojson和.json格式</p>
                  </Dragger>,
                )}
            </Item>
            <Item label="倾斜高度">
              {getFieldDecorator('tiltHeight', { initialValue: formInitialValues.tiltHeight })(
                <Input
                  disabled={disabled}
                  className={inputDisabledClassName}
                  autoComplete="off"
                ></Input>,
              )}
            </Item>
          </Row>
        </Form>
        <Row>
          <Col span={8}>
            <Button onClick={onClickProjectCompare}>方案比选</Button>
          </Col>
          <Col span={8}>
            <Button onClick={onClickMapFly}>飞行漫游</Button>
          </Col>
          <Col
            span={8}
            style={{
              height: '32px',
              background: '#ffffff7d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Switch
              onChange={onToggleLimitHeight}
              checkedChildren="控高分析"
              unCheckedChildren="控高分析"
              checked={project_limit_height_checked}
            ></Switch>
          </Col>
        </Row>
        <Row gutter={[0, 16]}>
          <Col Span={8}>
            {/* 跳转其他系统，点击按钮跳转至项目管理平台，根据项目编码，跳转至项目详情网页。 */}
            <Embed id={project_detail.projectCode}></Embed>
          </Col>
        </Row>
      </Col>
    </div>
  );
}
export default Form.create()(IndexPage);
