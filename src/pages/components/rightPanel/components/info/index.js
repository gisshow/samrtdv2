import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'

import styles from './styles.less';
import imgurl from './cq.png'
class Info extends Component {


  render() {

    return (
      <>
        <div className={styles.box}>
          <ModuleTitle title='昌强重工'/>
          <div className={styles.info}>
            <span>上海昌强重工机械有限公司位于上海市临港奉贤工业园区，占地面积7,1991平方米，总建筑面积4,8656平方米，是上海昌强工业科技股份有限公司为实施国家战略项目在临港设立的控股子公司。</span>

            <span>经过坚持不懈地自主研发，2017年上海昌强建造了世界首台36000吨超大型全模锻压机，形成了“拥有自主知识产权的超大型六向模锻设备，先进的全纤维多向模锻工艺，强大的模具开发制造能力”三大核心竞争力，具有研发建造大中型多向模锻设备的能力，能够独立完成100吨（全国唯一）以下各类复杂锻件多向模锻成形、热处理、机加工和质量检验能力。</span>
            <img src={imgurl}/>
          </div>
        </div>
       
      </>
    );
  }
}

export default Info;
