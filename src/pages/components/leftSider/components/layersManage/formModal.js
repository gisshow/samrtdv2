/* global Cesium */
/* global viewer */
/* global mars */
/* global mars3d */
import React, { Component } from 'react'
import RootContainer from '@/components/rootContainer'
import styles from './formModal.less'
import { connect } from 'dva';
import { Input, Select, Form, Upload,Button,message} from 'antd'
import { SERVER_TYPE } from '@/utils/config'

//经纬度坐标转笛卡尔坐标
function coordinatesArrayToCartesianArray(coordinates) {
  var positions = new Array(coordinates.length);
  for (var i = 0; i < coordinates.length; i++) {
    var coord=coordinates[i];
  //   coord=coord.split(" ");
      positions[i] = Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
  }
  return positions;
}

@Form.create()

@connect(({ RightFloatMenu}) => ({
  RightFloatMenu
})) 

class FormModal extends Component{
  constructor(props) {
    super(props)
    this.state = {
      upoloading:false,
      btnTextg:'点击上传文件',
      feaStr:null,
      fileDTO:null,
    }
  }

  componentDidMount(){
    //关闭键盘事件
    this.doKeyEvent(false)
  }

  componentWillUnmount(){
    //打开键盘事件
    this.doKeyEvent(true)
  }

  //键盘事件开关
  doKeyEvent = (isActive) => {
    var isHomekeystop;
    if (!isActive) {
      isHomekeystop = true;
      viewer.mars.keyboardRoam.unbind();
    } else {
      isHomekeystop = false;
      viewer.mars.keyboardRoam.bind()
    }
    //控制键盘漫游是否开启
    this.props.dispatch({
      type: 'RightFloatMenu/setisHomekeystop',
      payload: isHomekeystop
    })
  }

  btnSubmit=(val)=>{
    this.setState({
      btnTextg:'点击上传文件',
    },()=>{
      this.props.submit({
        ...val
      })
    })
  }

  add = () => {
    const { feaStr,fileDTO,fileTypeId } = this.state;
    const { validateFields } = this.props.form;
    validateFields((err, values) => {
      if (!err) {
        let valueObj = Object.assign({},values,{id: 'key_' + new Date().getTime()},{file:feaStr},{fileDTO, fileTypeId})
        this.btnSubmit(valueObj)
      }
    })
  }

  btnClose=()=>{
    this.setState({
      btnTextg:'点击上传文件',
    },()=>{
      this.props.close();
    })
  }

  btnClick = () =>{
    this.setState({
      feaStr:null
    })
  }

  render() {
    const { getFieldDecorator, getFieldValue,setFieldsValue} = this.props.form;
    const { btnTextg,upoloading } = this.state;
    return (
      <>
        {
          this.props.show &&
          <RootContainer>
            <div className={styles.bg}>
              <div className={styles.form}>
                <Form>
                  <div className={styles.title}>
                    添加自定义图层
                    <span className={`iconfont icon_add ${styles.close}`} onClick={this.props.close} />
                  </div>
                  <>
                    <div className={styles.label}>图层名称</div>
                    <Form.Item>
                      {getFieldDecorator('title', {
                        rules: [{ required: true, message: '请输入图层名称' }],
                      })(
                        <Input
                          placeholder="请输入"
                          onFocus={(e)=>{e.stopPropagation()}}
                        />,
                      )}
                    </Form.Item>
                  </>
                  <>
                    <div className={styles.label}>服务类型</div>
                    <Form.Item>
                      {getFieldDecorator('type', {
                        rules: [{ required: true, message: '请选择服务类型' }],
                      })(
                        <Select placeholder="请选择" 
                        >
                          {
                            SERVER_TYPE.map((v) => {
                              return (
                                <Select.Option key={v.type} value={v.type}>{v.name}</Select.Option>
                              )
                            })
                          }
                        </Select>
                      )}
                    </Form.Item>
                  </>
                  <>
                    {
                      (getFieldValue('type') === 'geojson_local'|| getFieldValue('type') === 'shapeFile_local')?(<>
                          <div className={styles.label}>文件上传</div>
                          <Form.Item>
                            {getFieldDecorator('file', {
                              rules: [{ required: true, message: '上传文件不能为空' }],
                            })(
                              <Upload
                                name="multipartFile"
                                // action="/portal/web/common/file"
                                // headers={{
                                //   token:window.localStorage.token
                                // }}
                                className={styles.UploadStyle}
                                style={{width:'100%'}}
                                multiple= {false}
                                showUploadList = {false}
                                maxCount={1}
                                beforeUpload = {(file)=>{
                                  this.setState({
                                    upoloading:true,
                                    btnTextg:'正在加载'
                                  },()=>{
                                    if(getFieldValue('type') === 'geojson_local'){
                                      const FILETYPEARR = ["json","geojson","text"];
                                      const fileType = file.name.split('.').pop();
                                      if(!FILETYPEARR.includes(fileType)){
                                        message.error('您上传的文件格式有无，请重新上传')
                                        this.setState({
                                          upoloading:false,
                                          btnTextg:'点击上传文件'
                                        })
                                        return false
                                      }
                                    }
                                    if(getFieldValue('type') === 'shapeFile_local'){
                                      const fileType = file.name.split('.').pop();
                                      if(fileType!=='shp'){
                                        message.error('您上传的文件格式有无，请重新上传')
                                        this.setState({
                                          upoloading:false,
                                          btnTextg:'点击上传文件'
                                        })
                                        return false
                                      }
                                    }
                                    const myThis = this;
                                    //开始解析
                                    const fileType = file.name.split('.').pop();
                                    let positions;
                                    if(fileType==='shp'){
                                      // const reader = new FileReader();
                                      // reader.readAsArrayBuffer(info.file.originFileObj,'UTF-8')
                                      // const filesize = info.file.originFileObj.size/1024/1024;
                                      // reader.onload = function(){
                                      // const binaryStr=this.result;                               
                                      // shapefile.open(binaryStr).then(source=>source.read().then(function log(result){
                                      //     let feaStr=result.value   
                                      //     myThis.setState({
                                      //       fileDTO:info.file.response.data,
                                      //       feaStr:feaStr,
                                      //       fileTypeId:'4',
                                      //       upoloading:false,
                                      //       btnTextg:'文件上传成功'
                                      //     })                                            
                                      //   })).catch((error) =>{
                                      //     message.error('您上传的文上传失败，请重新上传')
                                      //     this.setState({
                                      //       upoloading:false,
                                      //       btnTextg:'点击上传文件'
                                      //     })
                                      //   }) 
                                      // }  
                                    }else{
                                      const reader = new FileReader();
                                      reader.readAsText(file)
                                      reader.onload = function(){
                                        const { result } = this;  
                                        //如果上传的数据为多个面，只取第一个面                              
                                        let feaStr=JSON.parse(result);
                                        myThis.setState({
                                          fileDTO:file,
                                          feaStr:feaStr,
                                          fileTypeId:'4',
                                          upoloading:false,
                                          btnTextg:'文件上传成功'
                                        })
                                      }
                                    }
                                  })
                                }}
                                // onChange = {(info)=>{
                                //   if(info.file.status === 'done'){
                                //     const myThis = this;
                                //     //开始解析
                                //     const fileType = info.file.originFileObj.name.split('.').pop();
                                //     let positions;
                                //     if(fileType==='shp'){
                                //       // const reader = new FileReader();
                                //       // reader.readAsArrayBuffer(info.file.originFileObj,'UTF-8')
                                //       // const filesize = info.file.originFileObj.size/1024/1024;
                                //       // reader.onload = function(){
                                //       // const binaryStr=this.result;                               
                                //       // shapefile.open(binaryStr).then(source=>source.read().then(function log(result){
                                //       //     let feaStr=result.value   
                                //       //     myThis.setState({
                                //       //       fileDTO:info.file.response.data,
                                //       //       feaStr:feaStr,
                                //       //       fileTypeId:'4',
                                //       //       upoloading:false,
                                //       //       btnTextg:'文件上传成功'
                                //       //     })                                            
                                //       //   })).catch((error) =>{
                                //       //     message.error('您上传的文上传失败，请重新上传')
                                //       //     this.setState({
                                //       //       upoloading:false,
                                //       //       btnTextg:'点击上传文件'
                                //       //     })
                                //       //   }) 
                                //       // }  
                                //     }else{
                                //       const reader = new FileReader();
                                //       reader.readAsText(info.file.originFileObj)
                                //       reader.onload = function(){
                                //         const { result } = this;  
                                //         //如果上传的数据为多个面，只取第一个面                              
                                //         let feaStr=JSON.parse(result);
                                //         myThis.setState({
                                //           fileDTO:info.file.response.data,
                                //           feaStr:feaStr,
                                //           fileTypeId:'4',
                                //           upoloading:false,
                                //           btnTextg:'文件上传成功'
                                //         })
                                //       }
                                //     }
                                //   }
                                //   if(info.file.status === 'error'){
                                //     message.error('您上传的文上传失败，请重新上传')
                                //     this.setState({
                                //       upoloading:false,
                                //       btnTextg:'点击上传文件'
                                //     })
                                //   }
                                // }}
                              >
                                <Button className={styles.btn} loading={upoloading} onClick={()=>{this.btnClick()}}>{btnTextg}</Button>
                              </Upload>,
                            )}
                          </Form.Item>
                        </>
                      ):(
                        <>
                          <div className={styles.label}>数据服务地址</div>
                          <Form.Item>
                            {getFieldDecorator('url', {
                              rules: [{ required: true, message: '请输入数据服务地址' }],
                            })(
                              <Input
                                placeholder="请输入"
                              />,
                            )}
                          </Form.Item>
                        </>
                      )
                    }
                  </>
                  {
                    getFieldValue('type') === 'WMS' &&
                    <>
                      <div className={styles.label}>layerName</div>
                      <Form.Item>
                        {getFieldDecorator('layerName', {
                          rules: [{ required: true, message: '请输入layerName' }],
                        })(
                          <Input
                            placeholder="请输入"
                          />,
                        )}
                      </Form.Item>
                    </>
                  }
                  <div className={styles.opera}>
                    <div className={styles.btn} onClick={()=>{this.btnClose()}}>取消</div>
                    <div className={styles.btn} onClick={this.add}>确定</div>
                  </div>
                </Form>
              </div>
            </div>
          </RootContainer>
        }
      </>
    );
  }
}

export default FormModal
