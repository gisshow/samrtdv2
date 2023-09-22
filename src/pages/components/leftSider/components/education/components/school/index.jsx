import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle';
import { Tabs, Radio,message } from 'antd'
import style from './index.less'
import { connect } from 'dva'

@connect(({ House }) => ({
  House
}))

class Schools extends Component {
  constructor(props) {
    super(props);
    this.state= {
      model:'left',
      show:false
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
   
  }

  handleModeChange = val => {
    const mode = val.target.value;
    this.setState({ mode });
  }

  message=()=>{
    message.info('周边地块为空')
  }

  render() {
    const {title, mode, type,landLocation} =this.props;
    const {schoolInfo}=this.props.House;
    return (     
      <div className={style.schools}>
        <div>
          {
            type === 'built' && <Tabs defaultActiveKey='1' centered size="large" >
              <Tabs.TabPane tab='学校信息' key='1'>
                <div className={style.resle}>
                  <div className={style.resw}>
                    <div>学校名称</div><div>{schoolInfo.schoolName===null? '' :schoolInfo.schoolName}</div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>学校状态</div><div>{schoolInfo.buildStatus===1?'已建':schoolInfo.buildStatus===2?'在建':'已建'}</div>
                    </div>
                    <div className={style.rows}>
                      <div>学校类型</div><div>{schoolInfo.schoolType==='1'?'幼儿园':schoolInfo.schoolType==='2'?'小学':schoolInfo.schoolType==='3'?'初中':schoolInfo.schoolType==='4'?'高中':schoolInfo.schoolType==='2,3'?'九年一贯制':schoolInfo.schoolType==='3,4'?'完全中学':schoolInfo.schoolType==='2,3,4'?'十二年制':''}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>学校规模</div><div>{schoolInfo.schoolSize===null? '' :schoolInfo.schoolSize}</div>
                    </div>
                    <div className={style.rows}>
                      <div>学校性质</div><div>{schoolInfo.schoolProperty===1?'公办':schoolInfo.schoolProperty===2?'民办':'普惠'}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>校舍面积</div><div></div>
                    </div>
                    <div className={style.rows}>
                      <div>用地面积</div><div>{schoolInfo.schoolArea===null? '' :schoolInfo.schoolArea}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>在校学生数量</div><div>{schoolInfo.studentNum===null? '' :schoolInfo.studentNum}</div>
                    </div>
                    <div className={style.rows}>
                      <div>专任教师数量</div><div>{schoolInfo.teacherNum===null? '' :schoolInfo.teacherNum}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>建校年份</div><div>{schoolInfo.schoolDate===null? '' :schoolInfo.schoolDate}</div>
                    </div>
                  </div>
                  <div className={style.resw}>
                    <div>宗地号</div>  
                    <div>{schoolInfo.parcelNo===null? '' :schoolInfo.schoolName}</div>
                  </div>
                </div>
                <div className={style.footers}>
                  <div className={style.ablity}>
                    <span onClick={()=>{this.props.changeName('massif')}}>所属地块</span>
                    <span onClick={()=>{landLocation?(this.props.changeName('periphery')):this.message()}}>学校周边</span>
                    {/* <div onClick={()=>{this.props.changeName('region')}}>所属学区</div>                 
                    <div>校车信息</div>
                    <div>监控视频</div> */}
                  </div>
                </div>
              </Tabs.TabPane>
              {(schoolInfo.projectCode!==null|| schoolInfo.projectName!==null)&&<Tabs.TabPane tab='工程信息' key='2'>
                <div className={`${style.resle}  ${style.free}`}>
                  <div className={style.resw}>
                    <div>在建项目名称(学校名称)</div><div>{schoolInfo.schoolName===null? '' :schoolInfo.schoolName}</div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>学校状态</div><div>{schoolInfo.buildStatus===1?'已建':schoolInfo.buildStatus===2?'在建':'规划待建'}</div>
                    </div>
                    <div className={style.rows}>
                      <div>学校类型</div><div>{schoolInfo.schoolType==='1'?'幼儿园':schoolInfo.schoolType==='2'?'小学':schoolInfo.schoolType==='3'?'初中':schoolInfo.schoolType==='4'?'高中':schoolInfo.schoolType==='2,3'?'九年一贯制':schoolInfo.schoolType==='3,4'?'完全中学':schoolInfo.schoolType==='2,3,4'?'十二年制':''}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>学校规模</div><div>{schoolInfo.schoolSize===null? '' :schoolInfo.schoolSize}</div>
                    </div>
                    <div className={style.rows}>
                      <div>学校性质</div><div>{schoolInfo.schoolProperty===1?'公办':schoolInfo.schoolProperty===2?'民办':'普惠'}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>开工时间</div><div>{schoolInfo.projectStartDate===null? '' :schoolInfo.projectStartDate}</div>
                    </div>
                    <div className={style.rows}>
                      <div>预计建成时间</div><div>{schoolInfo.schoolDate===null? '' :schoolInfo.schoolDate}</div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>用地面积</div><div>{schoolInfo.schoolArea===null? '' :schoolInfo.schoolArea}</div>
                    </div>
                    <div className={style.rows}>
                      <div>校舍面积</div><div></div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>宗地号</div><div>{schoolInfo.parcelNo===null? '' :schoolInfo.parcelNo}</div>
                    </div>
                    <div className={style.rows}>
                      <div>建设类型</div><div>{schoolInfo.buildType===null? '' :schoolInfo.buildType}</div>
                    </div>
                  </div>
                  <div className={style.resw}>
                    <div>学校地址</div><div>{schoolInfo.schoolAddress===null? '' :schoolInfo.schoolAddress}</div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>施工阶段</div><div></div>
                    </div>
                    <div className={style.rows}>
                      <div>形象进度</div><div></div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>建设单位</div><div>{schoolInfo.projectBy===null? '' :schoolInfo.projectBy}</div>
                    </div>
                    <div className={style.rows}>
                      <div>施工单位</div><div></div>
                    </div>
                  </div>
                  <div className={style.lines}>
                    <div className={style.rows}>
                      <div>监理单位</div><div></div>
                    </div>
                    <div className={style.rows}>
                      <div>勘察单位</div><div></div>
                    </div>
                  </div>
                </div>
                <div className={style.footers}>
                  <div className={style.ablity}>
                    <span onClick={()=>{this.props.changeName('massif')}}>所属地块</span>                 
                    <span onClick={()=>{landLocation?(this.props.changeName('periphery')):this.message()}}>学校周边</span>
                    {/* <div onClick={()=>{this.props.changeName('region')}}>所属学区</div>
                    <div>校车信息</div>
                    <div>监控视频</div> */}
                  </div>
                </div>
              </Tabs.TabPane>}
            </Tabs>
          }
          { 
            type === 'construction'  &&
                <div>
                  <div className={style.reshearde}>学校信息</div>
                  <div className={style.rescomnt}>
                    <div className={`${style.resle}  ${style.free}`}>
                      <div className={style.resw}>
                        <div>在建项目名称</div><div>在建项目名称</div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>是否属于"359"地块</div><div>是否属于"359"地块</div>
                        </div>
                        <div className={style.rows}>
                          <div>预计建成时间</div><div>预计建成时间</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>学校性质</div><div>学校性质</div>
                        </div>
                        <div className={style.rows}>
                          <div>学校类型</div><div>学校类型</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>办学规模（学段班级数&提供学位数）</div><div>办学规模（学段班级数&提供学位数）</div>
                        </div>
                        <div className={style.rows}>
                          <div>开工时间</div><div>开工时间</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>校舍面积</div><div>校舍面积</div>
                        </div>
                        <div className={style.rows}>
                          <div>用地面积</div><div>用地面积</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>投资总额</div><div>投资总额</div>
                        </div>
                        <div className={style.rows}>
                          <div>建设类型</div><div>建设类型</div>
                        </div>
                      </div>
                      <div className={style.resw}>
                        <div>学校地址</div>
                        <div>学校地址</div>  
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>形象进度</div><div>形象进度</div>
                        </div>
                        <div className={style.rows}>
                          <div>施工阶段</div><div>施工阶段</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>项目造价</div><div>项目造价</div>
                        </div>
                        <div className={style.rows}>
                          <div>项目面积</div><div>项目面积</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>建设单位</div><div>建设单位</div>
                        </div>
                        <div className={style.rows}>
                          <div>资金来源</div><div>资金来源</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>工地状态</div><div>工地状态</div>
                        </div>
                        <div className={style.rows}>
                          <div>工程类型</div><div>工程类型</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>工程造价</div><div>工程造价</div>
                        </div>
                        <div className={style.rows}>
                          <div>工程面积</div><div>工程面积</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>监理单位</div><div>监理单位</div>
                        </div>
                        <div className={style.rows}>
                          <div>施工单位</div><div>施工单位</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>设计单位</div><div>设计单位</div>
                        </div>
                        <div className={style.rows}>
                          <div>勘察单位</div><div>勘察单位</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>当前建设单位</div><div>当前建设单位</div>  
                        </div>
                        <div className={style.rows}>
                          <div>审图单位</div><div>审图单位</div>
                        </div>
                      </div>
                    </div>
                    <div className={style.footers}>
                      <div className={style.constructe}>
                          <span onClick={()=>{this.props.changeName('massif')}}>所属地块</span>
                          {/* <span onClick={()=>{this.props.changeName('region')}}>所属学区</span> */}
                          <span onClick={()=>{landLocation?(this.props.changeName('periphery')):this.message()}}>学校周边</span>
                          {/* <div>监控视频</div> */}
                        </div>
                    </div>
                  </div>
             </div>
          }
          { 
            type === 'notbuilt'  &&
                <div>
                  <div className={style.reshearde}>学校信息</div>
                  <div className={style.rescomnt}>
                    <div className={style.resle}>
                      <div className={style.resw}>
                        <div>在建项目名称（学校名称）</div><div>{schoolInfo.projectName}</div>
                      </div>                    
                      <div className={style.resw}>
                        <div>是否属于"359"地块</div><div>{schoolInfo.is_359===1?'是':'否'}</div>
                      </div>
                      <div className={style.lines}>               
                        <div className={style.rows}>
                          <div>学校状态</div><div>{schoolInfo.buildStatus===1?'已建':schoolInfo.buildStatus===2?'在建':'规划待建'}</div>
                        </div>
                        <div className={style.rows}>
                          <div>学校类型</div><div>{schoolInfo.schoolType==='1'?'幼儿园':schoolInfo.schoolType==='2'?'小学':schoolInfo.schoolType==='3'?'初中':schoolInfo.schoolType==='4'?'高中':schoolInfo.schoolType==='2,3'?'九年一贯制':schoolInfo.schoolType==='3,4'?'完全中学':schoolInfo.schoolType==='2,3,4'?'十二年制':''}</div>
                        </div>
                      </div>
                      <div className={style.lines}>                 
                        <div className={style.rows}>
                          <div>学校规模</div><div>{schoolInfo.schoolSize}</div>
                        </div>
                        <div className={style.rows}>
                          <div>学校性质</div><div>{schoolInfo.schoolProperty===1?'公办':schoolInfo.schoolProperty===2?'民办':'普惠'}</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>规划用途</div><div></div>
                        </div>
                        <div className={style.rows}>
                          <div>用地面积</div><div>{schoolInfo.schoolArea}</div>
                        </div>
                      </div>
                      <div className={style.lines}>
                        <div className={style.rows}>
                          <div>宗地号</div><div>{schoolInfo.parcelNo}</div>
                        </div>
                        <div className={style.rows}>
                          <div>当前地块状态</div><div></div>
                        </div>
                      </div>
                      <div className={style.resw}>
                        <div>投资总额</div>
                        <div>{schoolInfo.projectCost}</div>  
                      </div>
                      <div className={style.resw}>
                        <div>学校地址</div>
                        <div></div>  
                      </div>
                    </div>
                    <div className={style.footers}>
                      <div className={style.ablity}>
                          <span onClick={()=>{this.props.changeName('massif')}}>所属地块</span>
                          <span onClick={()=>{landLocation?(this.props.changeName('periphery')):this.message()}}>学校周边</span>
                          {/* <div onClick={()=>{this.props.changeName('region')}}>所属学区</div> */}
                        </div>
                    </div>
                  </div>
             </div>
          }
        </div>
      </div>
    );
  }
}

export default Schools