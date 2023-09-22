import React, { Component } from 'react'
import styles from './modalVideo.less'
import RootContainer from '@/components/rootContainer'

export default class ModalVideo extends Component {

  render() {
    let { src, show } = this.props
    return (
      <>
        {
          show &&
          <RootContainer>
            <div className={styles.bg}>
              <div className={styles.box}>
                <video src={src} controls autoPlay muted />
                <span className={`iconfont icon_add ${styles.close}`} onClick={this.props.close} />
              </div>
            </div>
          </RootContainer>
        }
      </>
    )
  }
}
