import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom,Coord,Label, Interval } from 'bizcharts';
import styles from './index.less';
import DataSet from "@antv/data-set";

const formatNum=(num,field,isFormat)=>{
  if(field==="quantity"){
    if(isFormat){
      num=(num+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,");
    }
    return num
  }
  num=Number(num);
  if(num>10000){
    num=num/1000000;
  }
  num=num.toFixed(2);
  var numArr=num.split('.');
  if(isFormat){
    num=(numArr[0]+"").replace(/(\d)(?=(\d{3})+$)/g,"$1,")+'.'+numArr[1];
  }
  return num;
  
}

/**条形图 */
class Bar extends Component {
  state = {
    autoHideXLabels: false,
  };

  componentDidMount() {
    window.addEventListener('resize', this.resize.bind(this), { passive: true });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this));
  }

  handleRoot = n => {
    this.root = n;
  };

  handleRef = n => {
    this.node = n;
  };

  resize=()=> {
    if (!this.node) {
      return;
    }
    const canvasWidth = this.node.parentNode.clientWidth;
    const { data = [], autoLabel = true } = this.props;
    if (!autoLabel) {
      return;
    }
    const minWidth = data.length * 30;
    const { autoHideXLabels } = this.state;

    if (canvasWidth <= minWidth) {
      if (!autoHideXLabels) {
        this.setState({
          autoHideXLabels: true,
        });
      }
    } else if (autoHideXLabels) {
      this.setState({
        autoHideXLabels: false,
      });
    }
  }

  getAreaFormat=(num,scale)=>{
    num=num/scale;
    num=num.toFixed(2);
    return num;
  }

  render() {
    const {
      height,
      title,
      forceFit = true,
      data=[],
      type,
      step=1,
      color = 'rgba(24, 144, 255, 0.85)',
      padding=[0 ,20 ,15 ,90],
    } = this.props;
    const { autoHideXLabels } = this.state;
    let scale={
    }
    let tooltip = [
      'label*num',
      (label, num) => ({
        name:"数量",
        title:label,
        value:num
      }),
    ];
    let label=[
      'num',
      (val)=>{
        return {
          position:"middle",
          offsetX:5,
          style:{fill:'#fff'},
          content:val,
        }
      }
    ]

    if(type==="area"){
      scale={
        num:{
          formatter:val=>parseInt(val/step)
        },
      };
      tooltip=[
        'label*num',
        (label, num) => ({
          name:"面积",
          title:label,
          value:this.getAreaFormat(num,step),
        }),
      ];
      label=[
        'num',
        (val)=>{
          return {
            position:"middle",
            offsetX:5,
            style:{fill:'#fff'},
            content:this.getAreaFormat(val,step)<0.01?'<0.01':this.getAreaFormat(val,step),
          }
        }
      ]
    }

      
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    // console.log(ds,dv)
    dv.transform({
      type: "reverse",
    });

    return (
      <div className={styles.chart} style={{ height }} >
        <div ref={this.handleRef}>
          {/* { */}
            {/* // type==="area" ?
            // <Chart height={height} forceFit={forceFit} data={dv} padding={padding}>
            //     <Coord transpose />
            //     <Axis name="num" 
            //       label={{formatter(text, item, index){
            //         return formatNum(text)+`${<span>km&sup2;</span>}`
            //       }}}
            //     />
            //     <Tooltip position="right"/>
            //     <Geom type="interval" position="label*num"
            //       style={{shadowBlur:5,shadowColor:'#6FCAFA'}}>
            //     </Geom>
            //   </Chart>
            // : */}
            {
              <Chart height={height} autoFit data={dv} scale={scale} padding={padding}>
                <Coord transpose />
                <Axis name="label" label={{autoRotate:false,formatter(text){
                  if(text.length>5){
                    return text.substring(0,5)+"...";
                  }else{
                    return text
                  }
                }}}/>
                <Tooltip position="right"/>
                <Interval position="label*num" tooltip={tooltip} label={label} color={'#8EE0F8'}/>
                {/* <Geom type="interval" position="label*num" color={'#8EE0F8'}></Geom> */}
              </Chart>
            }
          {/* // } */}
          {/* label={['num',(val)=>({position:"middle",offsetX:5,style:{fill:'#fff'}})]} */}
          
        </div>
      </div>
    );
  }
}

export default Bar;
