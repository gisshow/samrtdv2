import React, { Component } from 'react'
import styles from './styles.less'

export default class Menu extends Component {
  render() {
    return (
      <div className={styles.box}>
        <div className={styles.btn}>
        <span className={`iconfont icon_menu ${styles.icon}`} />
        <span>菜单</span>
        </div>
      </div>
    );
  }
}
