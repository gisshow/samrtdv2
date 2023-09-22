/* global Cesium */
/* global viewer */
/* global mars3d */
/* global $ */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';
import { data } from './data'
import ModalVideo from './modalVideo';

let newData = data.map((v) => {
  return {
    ...v,
    play: false
  }
})

export default class SafeForVideo extends Component {

  state = {
    divPoints: [],
    isShowModal: false,
    modalVideoSrc: '',
    list: newData
  }

  componentDidMount() {
    this.addData()
  }

  componentWillUnmount() {
    this.removeData();
    $('.cesium-popup').remove();
  }

  flyTo = (hierarchy) => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees((hierarchy[0] + hierarchy[6]) / 2, (hierarchy[1] + hierarchy[7]) / 2, 500),
    })
  }

  removeData = () => {
    const { divPoints } = this.state;
    if (divPoints) {
      divPoints.forEach(v => {
        v.htmlEntity.destroy()
        $(`#video_${v.id}`).remove()
        viewer.entities.removeById(`video_polygon_${v.id}`)
        $(document).off('click', `#btn_modal_${v.id}`)
        $(document).off('click', `#btn_mix_${v.id}`)
      });
    }
  }

  getIsMixed = (id) => {
    let { list } = this.state
    let item = list.find((v) => {
      return v.id == id
    })
    return item.play
  }

  setMixed = (id) => {
    let { list } = this.state
    let newList = list.map(v => {
      return {
        ...v,
        play: v.id == id ? !v.play : v.play
      }
    })
    this.setState({
      list: newList
    })
  }

  bindMix = (v, e) => {
    e && e.stopPropagation()
    let isMixed = this.getIsMixed(v.id)
    if (!isMixed) {
      let el = document.createElement('video')
      el.id = `video_${v.id}`
      el.loop = 'loop'
      el.muted = 'muted'
      el.src = v.url
      el.style.display = 'none'
      document.body.appendChild(el)
      viewer.entities.add({
        id: `video_polygon_${v.id}`,
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights(v.hierarchy)),
          stRotation: v.rotation,
          material: el,
        },
      });
      el.load()
      el.play()
      $('.cesium-popup').remove();
      this.flyTo(v.hierarchy)
    } else {
      $(`#video_${v.id}`).remove()
      viewer.entities.removeById(`video_polygon_${v.id}`)
    }
    $(`#btn_mix_${v.id}`).text(!isMixed ? '停止播放' : '融合播放')
      .css('background', !isMixed ? 'rgba(245,34,45,0.60)' : 'rgba(28,144,226,0.60)')
    this.setMixed(v.id)
  }

  addData = () => {
    let arr = [];
    let _this = this
    data.forEach((v) => {
      let html = new mars3d.DivPoint(viewer, {
        id: v.id,
        html: `<div class="${styles.point} ${v.online ? styles.on : ''}"><span class="iconfont icon_monitor_Online" /></div>`,
        popup: `<div class="${styles.popup}">
                    <div class="${styles.name}">${v.name}</div>
                    <div class="${styles.state} ${v.online ? styles.on : ''}">${v.online ? '在线' : '下线'}</div>
                    <div class="${styles.btnBox}">
                        <div class="${styles.btn}" id="btn_modal_${v.id}" style="display: ${v.online ? 'display' : 'none'}">弹窗播放</div>
                        <div class="${styles.btn}" id="btn_mix_${v.id}" style="display: ${v.online ? 'display' : 'none'}">融合播放</div>
                    </div>
                </div>`,
        anchor: [-15, 50],
        position: Cesium.Cartesian3.fromDegrees((v.hierarchy[0] + v.hierarchy[6]) / 2, (v.hierarchy[1] + v.hierarchy[7]) / 2),
        click: (v) => {
          let isMixed = _this.getIsMixed(v.id)
          $(`#btn_mix_${v.id}`).text(isMixed ? '停止播放' : '融合播放')
            .css('background', isMixed ? 'rgba(245,34,45,0.60)' : 'rgba(28,144,226,0.60)')
        }
      });
      arr.push({
        id: v.id,
        htmlEntity: html,
      });
      $(document).on('click', `#btn_modal_${v.id}`, function(){
        _this.openModal(v.url)
      })
      $(document).on('click', `#btn_mix_${v.id}`, function(){
        _this.bindMix(v)
      })
    });
    this.setState({
      divPoints: arr,
    });
  }

  openModal = (src, e) => {
    e && e.stopPropagation()
    this.setState({
      isShowModal: true,
      modalVideoSrc: src
    })
  }

  closeModal = () => {
    this.setState({
      isShowModal: false,
    })
  }

  render() {
    const { isShowModal, modalVideoSrc, list } = this.state
    return (
      <>
        <div className={styles.box}>
          <ModuleTitle title='固定摄像头列表' />
          <div className={styles.table}>
            {
              list.map((v, k) => {
                return (
                  <div className={styles.row} key={v.id} onClick={() => this.flyTo(v.hierarchy)}>
                    <div className={styles.num}>{k+1}</div>
                    <div className={styles.name}>{v.name}</div>
                    <div className={styles.state}>{v.online ? '在线' : '下线'}</div>
                    {
                      v.online ?
                        (
                          <div className={styles.play}>
                            {
                              v.play ?
                                <div className={styles.close} onClick={(e) => this.bindMix(v, e)}>停止播放</div>
                                :
                                <span className={`iconfont icon_play ${styles.icon}`}>
                                  <div className={styles.opera}>
                                    <div onClick={(e) => this.openModal(v.url, e)}>弹窗播放</div>
                                    <div onClick={(e) => this.bindMix(v, e)}>融合播放</div>
                                  </div>
                                </span>
                            }
                          </div>
                        )
                        :
                        <div className={styles.play}>——</div>
                    }
                  </div>
                )
              })
            }
          </div>
        </div>
        <ModalVideo show={isShowModal}
                    src={modalVideoSrc}
                    close={this.closeModal}/>
      </>
    );
  }
}
