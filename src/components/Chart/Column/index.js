import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom,Legend } from 'bizcharts';
import styles from './index.less';
/**柱状图 */
class Column extends Component {
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
      color = 'rgba(24, 144, 255, 0.85)',
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
            scale={scale}
            height={title ? height - 41 : height}
            forceFit={forceFit}
            data={data}
            padding={padding || 'auto'}
          >
            <Axis
              name="label"
              title={false}
              label={autoHideXLabels ? false : {}}
              tickLine={autoHideXLabels ? false : {}}
            />
            <Axis name="num" min={0} />
            <Legend name="label" visible={false} />
            <Tooltip showTitle={false} crosshairs={false} />
            <Geom type="interval" position="label*num" 
              style={{shadowBlur:5,shadowColor:'#6FCAFA'}}
              color={['label',['l(90) 0:#61BDFC 1:#3288F8','l(90) 0:#A8E7FD 1:#6FB7FA','l(90) 0:#35F4F4 1:#18E5E6','l(90) 0:#36EEDB 1:#19D9B4','l(90) 0:#FFE02D 1:#FFBD14']]}
              tooltip={tooltip} />
          </Chart>
        </div>
      </div>
    );
  }
}

export default Column;
