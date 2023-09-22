import React, { Component } from 'react';
import { Chart, Axis, Tooltip,Legend, Coordinate, Interaction, Interval, registerShape } from 'bizcharts';

// const sliceNumber=0.01;
// registerShape("interval","sliceShape",{
//       draw(cfg,container){
//         const points=cfg.points;
//         let path=[];
//         path.push(["M",points[0].x,points[0].y]);
//         path.push(["L",points[1].x,points[1].y-sliceNumber]);
//         path.push(["L",points[2].x,points[2].y-sliceNumber]);
//         path.push(["L",points[3].x,points[3].y]);
//         path.push("Z");
//         path=this.parsePath(path);
//         return container.addShape("path",{
//           attrs:{
//             fill:cfg.color,
//             path:path
//           }
//         })
//       }
//     })
/**饼图-分割空白 */
class Pieslice extends Component {
  state = {
    // autoHideXLabels: false,
  };

  

  render() {
    const {
      height,
      title,
      forceFit = true,
      data,
      color = 'rgba(24, 144, 255, 0.85)',
      padding="auto",
      isShowLabel =false,
      isShowLegned =false,
      isShowLinShi = true,
    } = this.props;

    return (
      
          <Chart height={height} autoFit data={data} padding={padding}>
            {isShowLinShi ? <Coordinate type="theta" radius={0.8} innerRadius={0.75}/> :<Coordinate type="theta" radius={0.8} />}
            <Tooltip showTitle={false} crosshairs={false} />
            <Axis name="label" visible={true}/>
            <Legend name="label" visible={isShowLegned} itemName={{style:{fill:'#BAC2D4'}}}/>
            {isShowLabel ? <Interval adjust="stack" position="num" color="label" shape="sliceShape" label={['label',{offset:10,style:{fill:"#BAC2D4"}}]}/> :<Interval adjust="stack" position="num" color="label" shape="sliceShape"/>}
            <Interaction type="element-single-selected"/>
          </Chart>
    );
  }
}

export default Pieslice;
