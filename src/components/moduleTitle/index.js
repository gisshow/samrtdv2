import styles from './styles.less';
import React from 'react';
import SplitLine from '@/components/splitLine'
export default function(props) {
  return (
    <>
      <div className={styles.head} style={{ width: props.width ? props.width+'px' : '400px' }} >
        <div className={styles.top} />
        <div className={styles.mid}>{props.title}</div>
        {props.children}
        <div className={styles.bottom} />
      </div>
      {/* <div className={styles.line} /> */}
    </>
  );
}
