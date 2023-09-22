import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom,Legend,Coord } from 'bizcharts';
import styles from './index.less';
/**南丁格尔玫瑰彩图 */
class Polar extends Component {
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

  render() {
    const {
      height,
      title,
      forceFit = true,
      data,
      padding,
    } = this.props;

    const { autoHideXLabels } = this.state;

    const scale = {
      label: {
        type: 'cat',
      },
      num: {
        min: 0,
      },
    };

    const tooltip = [
      'label*num',
      (x, y) => ({
        name: x,
        value: y,
      }),
    ];

    return (
      <div className={styles.chart} style={{ height }} ref={this.handleRoot}>
        <div ref={this.handleRef}>
          {title && <h4 style={{ marginBottom: 20 }}>{title}</h4>}
          <Chart
            height={title ? height - 41 : height}
            forceFit={forceFit}
            data={data}
            padding={padding || 'auto'}
          >
            <Coord type="polar"/>
            {/* <Legend position="right-center"/> */}
            <Tooltip showTitle={false} crosshairs={false} />
            <Geom type="interval" position="label*num" 
              style={{shadowBlur:5,shadowColor:'#6FCAFA'}}
              color={['label',['#367BDF','#36C4DF','#22C898','#1EC053','#CA980A','#D05555']]}
              tooltip={tooltip} />
          </Chart>
        </div>
      </div>
    );
  }
}

export default Polar;
