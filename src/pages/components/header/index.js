/* global viewer */
/* global Cesium */
/* global $ */
import React, { Component } from 'react';
import styles from './styles.less';
import { connect } from 'dva';

@connect(({ Home ,ContentBox}) => ({
  Home,
  ContentBox
}))
class Header extends Component {



  constructor(props) {
    super(props);
    this.state = {
      activeBanner: 0,
      activeBannertext: "综合态势",
      activeBanners: ["综合态势", "社区安全", "社区环境", "社区能耗", "社区设施", "社区服务"],
      activeBannerscode: ["ztts", "sqaq", "sqhj", "sqhn", "sqss", "sqfw"]

    }
    this.activeBannerNum = 0;

  }

  



  componentDidMount() {

    var th = this;

 

    $('#bannerLeft').click(function (e) {
     

      $(".point-sample-label-container").remove();

      if (th.activeBannerNum <= 0) {
        th.activeBannerNum = 0;
        th.setState({
          activeBanner: th.activeBannerNum
        })


      }
      else {
        th.activeBannerNum--
        th.setState({
          activeBanner: th.activeBannerNum
        })
      }

    
      th.props.dispatch({
        type: 'Home/setActiveBannerKey',
        payload: th.state.activeBannerscode[th.activeBannerNum],
      });

      th.setState({ activeBannertext: th.state.activeBanners[th.activeBannerNum] })
    });




    $('#bannerRight').click(function (e) {

      $(".point-sample-label-container").remove();
      
      if (th.activeBannerNum >= th.state.activeBanners.length - 1) {
        th.activeBannerNum = 0;
        th.setState({
          activeBanner: th.activeBannerNum
        })
      }
      else {
        th.activeBannerNum++
        th.setState({
          activeBanner: th.activeBannerNum
        })

      }

      
      th.props.dispatch({
        type: 'Home/setActiveBannerKey',
        payload: th.state.activeBannerscode[th.activeBannerNum],
      });


      th.setState({ activeBannertext: th.state.activeBanners[th.activeBannerNum] })

    });




  }
  render() {
    let { isShowNav } = this.props.Home;

    const { activeBannertext, activeBanner } = this.state;

    return (
      <div>

        <div className={styles.boxs}>
          <div className={styles.left}>智慧社区运维管理平台</div>

          <div className={styles.Center}>
            <div className={styles.headerCenter}>
              <div className={`${styles.menuItem} ${activeBanner === 0 ? styles.activemenu : ""} `} >社区态势</div>
              <div className={`${styles.menuItem} ${activeBanner === 1 ? styles.activemenu : ""} `}>社区安全</div>
              <div className={`${styles.menuItem} ${activeBanner === 2 ? styles.activemenu : ""} `}>社区环境</div>
              <div className={`${styles.menuItem} ${activeBanner === 3 ? styles.activemenu : ""} `}>社区能耗</div>
              <div className={`${styles.menuItem} ${activeBanner === 4 ? styles.activemenu : ""} `}>社区设施</div>
              <div className={`${styles.menuItem} ${activeBanner === 5 ? styles.activemenu : ""} `}>社区服务</div>

              {/* 智慧社区运维管理平台
              <div className={`${styles.menuItem} ${styles.activemenu}`} >视频监控</div>
              <div className={styles.menuItem}>人员通行</div>
              <div className={styles.menuItem}>车辆通行</div>
              <div className={styles.menuItem}>电子巡查</div>
              <div className={styles.menuItem}>周界报警</div> */}

            </div>
            {/* {this.props.children} */}
          </div>

          <div className={styles.headerRight}>
            <div className={styles.data}>
              <img src="data:image/png;base64,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" alt="" />
              <span className={styles.dateText}   >多云</span>
              <span  >2022/5/10</span>
            </div>
            <div className={styles.operation} >
              <span>
                <img src='data:image/png;base64,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' alt="" />
              </span>
              <span>
                <img src="data:image/png;base64,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" alt=""></img>
              </span>
              <span>
                <img src="data:image/png;base64,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" alt=""></img>
              </span>
              <span>
                <img src="data:image/png;base64,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" alt=""></img>
              </span>

            </div>


          </div>

          <div className={styles.headerBanner}>

            <div className={styles.arrow}   >
              <div className={styles.bannerTitle}  >{activeBannertext}</div>
              <div className={styles.bannerLeft} id="bannerLeft" ></div>
              <div className={styles.bannerRight} id="bannerRight" ></div>
            </div>
          </div>
        </div>

        <div className={styles.communityBottom}>
          <div >
            <p >5</p>
            <span >安防预警</span>
          </div>

          <div  >
            <p  >2866</p>
            <span  >社区总人数</span>
          </div>

          <div  >
            <p  >803</p>
            <span  >社区总车辆</span>
          </div>


          <div  >
            <p  >15</p>
            <span  >设备异常</span>
          </div>

          <div  >
            <p  >15</p>
            <span  >空气质量</span>
          </div>

          <div  >
            <p  >15</p>
            <span  >突发情况</span>
          </div>

        </div>


      </div>


    );
  }
}

export default Header;
