/* global Cesium */
/* global viewer */
/* global mars3d */
import styles from './styles.less';
import React, { Component } from 'react'
import {debounces} from '@/utils/index';
import { connect } from 'dva';

@connect(({ House,Home,RightFloatMenu }) => ({
  House,Home,RightFloatMenu
}))
class SearchPanel extends Component {

  constructor(props){
    super(props);
    this.handleInputChange=this.handleInputChange.bind(this);
    this.search=this.search.bind(this);
    this.onKeyup=this.onKeyup.bind(this);
    this.state={
      text:'',
      page:1,
      pageSize:10
    }
    this.deSearch=debounces(this.deSearch,500);
  }
  componentDidMount(){    
    this.props.onRefs && this.props.onRefs(this);
    this.props.dispatch({
      type:'RightFloatMenu/setisHomekeystop',
      payload:true
    })
    viewer.mars.keyboardRoam.unbind();
    
  }
  componentWillUnmount(){
    this.props.dispatch({
      type:'RightFloatMenu/setisHomekeystop',
      payload:false
    })
    viewer.mars.keyboardRoam.bind() 
  }


  search=(value)=>{
    const {text} =this.state;
    if(!text){
      this.setState({
        text:value,
      });
    }
    this.props.onSearch && this.props.onSearch(text||value);
    
  }

  handleInputChange=(e)=>{
    this.setState({
      text:e.target.value || ''
    })
    this.deSearch(e.target.value);
    // this.props.dispatch({
    //   type:'House/getSearchPrevList',
    //   payload:{
    //     keyword:e.target.value,
    //   }
    // })
  }

  deSearch=(value)=>{
    this.props.onChange && this.props.onChange(value)
  }
  onKeyup=(e)=>{
    if(e.keyCode === 13) {
      this.search()
    }
  }
  onFocus=(e)=>{
    const {text} =this.state;
    if(text!=='') return;
    this.props.onFocus && this.props.onFocus(e);
  }
  onBlur=(e)=>{
    this.props.onBlur && this.props.onBlur(e);
  }
  showTotal=(total)=>{
    return "wer"+total

  }

  render(){
    const {text} =this.state;

    return (
      <>
        <div className={styles.box}>
          <div className={styles.wrapper}>
            <input className={styles.input}  placeholder={this.props.placeholder || "请输入关键字搜索"} value={text} onFocus={()=>this.onFocus()} onBlur={()=>this.onBlur()} onChange={this.handleInputChange} onKeyUp={this.onKeyup}/>
            <i className="iconfont" onClick={this.search}>&#xe646;</i>
            <div className={styles.child}>
              {this.props.children}
            </div>
          </div>


          {/*<div className={styles.searchList}>*/}
          {/*  <p>共找到{searchList &&searchList.total}个搜索结果</p>*/}
          {/*  <ul>{searchList && searchList.map((item)=>{*/}
          {/*    return <li> <span className={styles.name}><span className={`iconfont icon_earth`}></span> {item.code}</span>---<span className={styles.address}>{item.address}</span></li>*/}
          {/*  })}</ul>*/}
          {/*  /!*<div className={styles.pagetation}>*!/*/}
          {/*  /!*  <Pagination size="small" total={searchList.list &&searchList.total} showSizeChanger showQuickJumper></Pagination>*!/*/}
          {/*  /!*</div>*!/*/}
          {/*</div>}*/}



        </div>
      </>
    );
  }

}

export default SearchPanel;
