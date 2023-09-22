import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom,Coord,Label, Interval } from 'bizcharts';
import styles from './index.less';
import DataSet from "@antv/data-set";

/**条形图 */
class Line extends Component {
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
      color = 'rgba(24, 144, 255, 0.85)',
      padding=[0 ,20 ,15 ,90],
    } = this.props;
    const { autoHideXLabels } = this.state;

      
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    // dv.transform({
    //   type: "sort",
    //   callback(a,b){
    //     return a.num-b.num;
    //   }
    // });

    return (
      <div className={styles.chart} style={{ height }} >
          <Chart height={height} autoFit data={dv} padding={padding}>
            <Axis name="label"/>
            <Axis name="num" label={{autoRotate:false}}/>
            <Tooltip crosshairs={{type:'y'}} showTitle={true} itemTpl="<li data-index={index}><div class='item'><span class='name'>人口数量：</span><span class='value'>{value}</span></div></li>"/>
            <Geom type="line" position="label*num" size={2}/>
            <Geom type="point" position="label*num" size={4}
              shape={'circle'}
              style={{stroke:'#fff',LineWidth:1}}
            />
          </Chart>
      </div>
    );
  }
}

export default Line;
