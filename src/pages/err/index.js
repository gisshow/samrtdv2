import React from 'react';
import {Button} from 'antd';
import styles from './style.less';
export default class ErrPage extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            tips:''
        }
    }
    download=()=>{
        // console.log('下载了')
    }
    isIE=()=>{
        const userAgent = navigator.userAgent;
        const isIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE')>-1;
        const isEdge = userAgent.indexOf('Edge') > -1 && !isIE;
        const isIE11 = userAgent.indexOf('Trident')>-1 && userAgent.indexOf('rv:11.0')>-1;
        if(isIE || isEdge || isIE11){
            return true;
        }else{
            return false;
        }
    }
    render(){
        const isIE = this.isIE()
        return (
            <div className={styles.errPage}>
                <div className={styles.content}>
                    <div className={styles.text}>抱歉，当前浏览器版本暂不支持访问</div>
                    {
                        isIE? (
                            <div className={styles.tip}>请尝试升级至 IE11 以上或下载 Chrome 浏览器进行访问</div>
                        ) : (
                            <div className={styles.tip}>请尝试下载 Chrome 浏览器进行访问</div>
                        )
                    }
                    
                    <Button className={styles.btn} onClick={this.download}>下载 Chrome</Button>
                </div>
            </div>
        )
    }
} 