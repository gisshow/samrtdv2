import React, { Component } from 'react'
import styles from './index.less'

/**
 * @description 边框四个角上的小点
 */

class BorderPoint extends Component{
    constructor(props){
        super(props);
      }
    render(){
        return(
            <div>
                <div style={{backgroundColor:this.props.pointColor || '#8C9CB8'}} className={styles.borderPoint + ' ' + styles.leftTop}></div>
                <div style={{backgroundColor:this.props.pointColor || '#8C9CB8'}} className={styles.borderPoint + ' ' + styles.rightTop}></div>
                <div style={{backgroundColor:this.props.pointColor || '#8C9CB8'}} className={styles.borderPoint + ' ' + styles.leftBottom}></div>
                <div style={{backgroundColor:this.props.pointColor || '#8C9CB8'}} className={styles.borderPoint + ' ' + styles.rightBottom}></div>
            </div>
        )
    }
}

export default BorderPoint