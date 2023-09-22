import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom,Coord,Label, Interval } from 'bizcharts';
import styles from './index.less';
import DataSet from "@antv/data-set";

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
      house='h1',
      color = 'rgba(24, 144, 255, 0.85)',
      padding=[0 ,20 ,15 ,90],
    } = this.props;
    const { autoHideXLabels } = this.state;

    let scale={
    }
    let tooltip = [
      'ratio*permanentNum*workingNum*residentNum',
      (ratio, permanentNum,workingNum,residentNum) => {
        return {
          name:label,
          value:
            '<div class="item"><span class="name">职住比：</span><span class="value">'+ratio+'</span></div>'+
            '<div class="item"><span class="name">常驻人口数量：</span><span class="value">'+(permanentNum || 0)+'</span></div>'+
            '<div class="item"><span class="name">工作人口数量：</span><span class="value">'+(workingNum || 0)+'</span></div>'+
            '<div class="item"><span class="name">居住人口数量：</span><span class="value">'+(residentNum || 0)+'</span></div>'
        }
      }
    ];
    
    let label=[
      'ratio',
      (val)=>{
        return {
          // position:"bottom",
          offsetX:-5,
          style:{fill:'#fff'},
          content:val?val.toFixed(2):0,
        }
      }
    ]
    if(type=="fluid"){
      label=[
        'ratio',
        (val)=>{
          return {
            // position:"bottom",
            // offsetX:-5,
            style:{fill:'#fff'},
            // content:val?val.toFixed(2):0,
          }
        }
      ]
      tooltip = [
        'ratio',
        (ratio) => {
          return {
            name:label,
            value:
              '<div class="item"><span class="name">人口数量：</span><span class="value">'+ratio+'</span></div>'
          }
        }
      ];
      
    }

    

      
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    dv.transform({
      type: "sort",
      callback(a,b){
        return a.ratio-b.ratio;
      }
    });

    return (
      <div className={styles.chart} style={{ height }} >
        <div ref={this.handleRef}>
            <Chart height={height} autoFit data={dv} scale={scale} padding={padding}>
              <Coord transpose />
              <Axis name="area" label={{autoRotate:false}}/>
              <Tooltip position="right" showTitle={true} itemTpl="<li data-index={index}>{value}</li>"/>
              <Interval position="area*ratio" tooltip={tooltip} label={label}/>
            </Chart>
        </div>
      </div>
    );
  }
}

export default Bar;
