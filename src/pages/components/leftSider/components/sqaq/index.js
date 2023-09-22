/* global $ */
/* global viewer */
/* global Cesium */
import React, { Component } from 'react'
import ModuleTitle from '@/components/moduleTitle'
import styles from './styles.less';
import { connect } from 'dva';
@connect(({ Home }) => ({
  Home
  
}))
class ContentBox extends Component {

  constructor(props) {
    super(props);
    this.sampleLabel01 =[];
    this.sampleLabel02 =[];
    this.sampleLabel03 =[];
  }

  removesampleLabels(  array)
  {

    array.forEach(sampleLabel => {
      sampleLabel.remove()
    });

   

  }

  toggle(tag,pid)
  {
    this.removeClassAll()
    $('#'+pid). addClass(styles.activeSystemItem)
    var img = $('#'+pid).find("img")[0];
    var src=img.src
    var idnex1=src.lastIndexOf(".")
    var txtnum=src.substring(idnex1-1,idnex1);
    txtnum=txtnum+txtnum;
    img.src=src.substring(0,idnex1-1)+txtnum+".png"


    if(tag=="1")
    {

     
      if(this.sampleLabel01.length==0)
      {
        this.addpdxtdataLabels()
       
      }
      else
      {
        this.removesampleLabels(this.sampleLabel01)
        this.sampleLabel01=[]
      }
  
    }

    
    if(tag=="2")
    {
     
      if(this.sampleLabel02.length==0)
      {
        this.addpsxtdataLabels()
       
      }
      else
      {
        this.removesampleLabels(this.sampleLabel02)
        this.sampleLabel02=[]
      }


  
    }

    if(tag=="3")
    {

      if(this.sampleLabel03.length==0)
      {
        this.addpfxtdataLabels()
       
      }
      else
      {
        this.removesampleLabels(this.sampleLabel03)
        this.sampleLabel03=[]
      }
  
    }

  

    this.props.dispatch({
      type: 'Home/setSampleLabe',
      payload: [this.sampleLabel01,this.sampleLabel02,this.sampleLabel03]
    });







  }

  resetimgSrcById(id,imgid)
  {
    var img =$('#'+id).find("img")[0]
    var src=img.src
    var idnex1=src.lastIndexOf("device")
    img.src=src.substring(0,idnex1)+"device"+imgid+".png"
  }

  removeClassAll()
  {
    $('#pdxt'). removeClass(styles.activeSystemItem)
    $('#psxt'). removeClass(styles.activeSystemItem)
    $('#pfxt'). removeClass(styles.activeSystemItem)
    this.resetimgSrcById("pdxt",1)
    this.resetimgSrcById("psxt",2)
    this.resetimgSrcById("pfxt",3)
  }

    //添加SampleLabel
    // 配电系统
    addpdxtdataLabels() {
      
      let position = Cesium.Cartesian3.fromDegrees( 121.923017, 40.895944, 13.37);
      let sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "供电装置1");
      this.sampleLabel01.push(sampleLabel)
      
    
      position = Cesium.Cartesian3.fromDegrees(121.924381, 40.896479, 13.35);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "供电装置2");
      this.sampleLabel01.push(sampleLabel)

    

      position = Cesium.Cartesian3.fromDegrees(121.925547,40.897174, 13.67);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "供电装置3");
      this.sampleLabel01.push(sampleLabel)


   
      position = Cesium.Cartesian3.fromDegrees(121.922474, 40.895461, 13.35);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "供电装置4");
      this.sampleLabel01.push(sampleLabel)

 

      position = Cesium.Cartesian3.fromDegrees(121.922272, 40.897385,15.45);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "供电装置5");
      this.sampleLabel01.push(sampleLabel)



  }

    //添加SampleLabel
    // 排水系统
    addpsxtdataLabels() {

      let position = Cesium.Cartesian3.fromDegrees( 121.924083,40.89797,24.3);
      let sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排水装置1");
      this.sampleLabel02.push(sampleLabel)
      
  
      position = Cesium.Cartesian3.fromDegrees(121.924131, 40.896753, 18.32);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排水装置2");
      this.sampleLabel02.push(sampleLabel)

    
     
      position = Cesium.Cartesian3.fromDegrees(121.925869,40.897019, 18.61);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排水装置3");
      this.sampleLabel02.push(sampleLabel)

       
   
      position = Cesium.Cartesian3.fromDegrees(121.92291,40.896171, 11.83);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排水装置4");
      this.sampleLabel02.push(sampleLabel)

 
     
      position = Cesium.Cartesian3.fromDegrees(121.921901, 40.896762,18.93);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排水装置5");
      this.sampleLabel02.push(sampleLabel)



  }


 //添加SampleLabel
    // 排风系统
    addpfxtdataLabels() {
    
      let position = Cesium.Cartesian3.fromDegrees(    121.922593,  40.897472,   16.88);
      let sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排风装置1");
      this.sampleLabel03.push(sampleLabel)
      
       
      position = Cesium.Cartesian3.fromDegrees(121.923356,40.897862,17.41);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排风装置2");
      this.sampleLabel03.push(sampleLabel)

    
       
      position = Cesium.Cartesian3.fromDegrees(121.923496, 40.897007, 13.44);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排风装置3");
      this.sampleLabel03.push(sampleLabel)

       
      
      position = Cesium.Cartesian3.fromDegrees( 121.92368,40.89667,13.35);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排风装置4");
      this.sampleLabel03.push(sampleLabel)

 
      
      position = Cesium.Cartesian3.fromDegrees( 121.924993, 40.896718,17.67);
      sampleLabel = new window.vtgl.PointObject.SampleLabel(viewer, position, "排风装置5");
      this.sampleLabel03.push(sampleLabel)



  }








  componentDidMount() {
 

  }

  render() {

    return (
      <>
        <div className={styles.deviceLeft}  >

          <img className={styles.line} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAOQCAYAAAAqlxGqAAAAAXNSR0IArs4c6QAAClBJREFUeF7tlm9MVecdx5/n3MuFwQWHKEilNQG0i39QZLZGR0lrzeiLdkusfdWQuDUY223OiKOZlly1mrJpNreuDaRJE9OkiUubtHtjs9DEsdgxd0VtwYlyU+SCcv1Duf+Ey7nnWbh/gHs5B+53XXyzL28u55zn+/ud5zmf53OOFEKItSPuKpszt1Vqcpu02e1T51L/ZOJQzb20wBkV1XVlqI5oMNz8VUnNFVl1/8Jae1bu+Ts3+sbv9veFohOThhBGoowW/032SxZXKnFGpt6ByX3ZsrO0oopVeUsqVuUYeniL3OTv+fjOgGf97es9vpnK6TNJ65i8nH4j6bOdLqPEslVripeuKL8sN/t7fT1dn1/QJyf1mZklk4kZTs84/XziWCZWxHLFNWHPyrKv2fzMJrk1cNXX/a+OT+LR5FJaNUzcwPSwxD+a1Y2lTrm65tkfy9pA70D3lc4PUi/NNFaatEX08bqooW8QQuTMw8i4TbNfcthzzklDRs0mUF1V97J8OnC1x+3pakspZCShEOJB2P98VJ/climeNntWx3eciz5NrafHnnZN5dZGuT3Q90XX8IVTVgWDt2+9J4TIy7ShECLkXFb6SvwJGXGsNC32dJ8o/f4v5XPBvs/O373UOrtgciPqQojAwM0OoFlsaP6Kx0xXZMuSDc3yhXD/h53+y8esio5d83yJNlz0ePk6s0xtwfqD8sWw5+2z/ktHUgbMWsDwRc8I2nDpxnUlsUwoFP9JFKgv2NAiGx4Muk7/5YujsXM7d87ZSdrfTiaIy7yt8dR+m9nohnFvi9wVHmp6P3f5Caty2rkTsECNuiZTB+0KDjXJxpB3T3te2bsPo2FjwLtHvhr0NrzjLDuNNtT+PSqM7xWaxqxmONVL7g0M7jiV/+hH8zS8L4SYU3mehqNGXdNis3pTveS+4HD975yPnLVuePItIVRz+nXrhrLVqNv/ulm9fWPD9bLZ7/tBa0Hx3y0ZPONyaCX5R4RQjbNnatJwVAjZbowEWsRLrohZvQP+4Vr562+GNh7/7vKLmUMfH2lvO6j03ccWeiOmlH0j5KuWR8cGV0YLyvpdMvlSy6w12tCllKb7vRXyuN9bFMl3TLhkcTCzVv/dDF0+n9ORE8mWZ5SyeUZHnUP37o3/sbIyImTad4rFXWQ8Q6Xkz2/ccCwvKsopLywMxp6BUkoeFsJWOvdzyXLSr7Ufivyp8U1HJqvidrtFW02NLqWcedFmEpw9JuMZphWGKGPDTB4Ll9RylUip1dIQGkIDMwAHkmvMfch9mMmrLGUMoSE0hGbOCnBbcFtwW3BbZMwAv9r4qQ8zAAf4qb/QhuSSch/CDMAB7kPuQ0JD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqYhNDQNzAAcoGloGkJD08AMwAGahqb5P4FGKSUPC2ErFSI241u9vbHf0tWrlRUEr7Ufivyk8U3H1PWaBUhxu92iraZGl1IquVMp25qvv85frOsPflFZGRFSWjaZXdfedlDpu48t/EiUkn+4ccMRLirKcRcWBuVxv7coMu6YcBUXBxdC+ttcd/l8TkdOJFseGhtcaS8o63dJaXybggtlXUpput9bId8I+aqP5hV3LxT4X1w/8M3QRnnAP1z724JHOi0LnnE5tJL8I0KoRiFE4TyNR4WQ7cZIoEW85IqYjZvqJfcHR3540lnymVUh7dzJt4RQzZnPULYadftfNxu/b2y4Xu4NDO44lf/oR9YNT9xfYGbp0VGjrmmxWb2fBQZ3yFeD3oZ3nGWn52mY0TaZnTfqmky3y1Qv2Rjy7mnPK3v3YTSc6iV3BYea3ncuP/EwGv40PNQkG0KDrtO5ZUfiDQ+n9v3zaqmV3NQzByY+0nhqv80s0zDubZEvhjxvdxqXEg3jw0LJ0SEhwtc8I2jD3I3lJWaZetvGFvlCuP/DTv/lY1ZFx655vkQbLnq8fJ1Zprag6qB8Lnj97Pm73b+xKhoYuNmBNsxf8dg2s8yWpdW/ktv9V//Rdevi762KBm/fek8IkQc0DTmXlb4Sf5hGfHtoWmxrPVm2aa98OnC1x+3pakspaKjpffQg7H8+qk+a3rHZTWhZWR25efmfpja0xxrWlD+5W9YGege6r3R+kOArrYYmlKZsE/p4nWHoG4QQOfPMdFzT7Jey7TnnpCGjKeO0+FH12tqX5dbAVV/3P//6SeqAxIjkCytxOD3GiF/QtPiFmfda2hsu7bD6ie0/kpv9vb6ers8v6JOT+uxovHh6p2TL9Fen1biZadizsuxrNj+zSW7y93x8Z8Cz/vb1Xp8Q6dq0+IJQaeNkcpx1vmTl6uLiFeWXZdX9C2s1e+75u/194/f6+0LRiclZt2+xpnPqJ8bJtJkqIWzZWVpRxaq8JRWrcgw9vCUWXTvirrI5c1ulJrdJm92e8RawmtisAiqq68pQHdFguPmrkpor/wFVriUpov9bfgAAAABJRU5ErkJggg==" alt="" ></img>
          <div id="systemBox" className={styles.systemBox}>
           
            <div  id="pdxt"  className={`${styles.systemItem} ${styles.activeSystemItem}`}   >
              <img  onClick={() => this.toggle('1',"pdxt")}
                src="./config/images/device1.png"
                alt=""
                className={styles.systemImg} />
                <div >供配电系统</div>
            </div>

            <div   id="psxt"   className={styles.systemItem}   >
              <img onClick={() => this.toggle('2',"psxt")}
                src="./config/images/device2.png"
                alt=""
                className={styles.systemImg} />
                <div >给排水系统</div>
            </div>


            
            <div  id="pfxt"   className={styles.systemItem}   >
              <img onClick={() => this.toggle('3',"pfxt")}
                src="./config/images/device3.png"
                alt=""
                className={styles.systemImg} />
                <div >送排风系统</div>
            </div>



          </div>



        </div>





      </>
    );
  }
}

export default ContentBox;
