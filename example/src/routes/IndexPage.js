import React from 'react';
import { connect } from 'dva';
import styles from './IndexPage.css';
// require('vtx-ui');
import {VtxExport} from 'vtx-ui';

function IndexPage() {
  const exportProps = {
    downloadURL:'http://localhost:8002/',
    // rowButton:false,
    getExportParams(exportType){
        const columnNames = "编号,名称,所属处置单位,监测类型,开始运行日期,排序号",
            columnFields = "code,name,factoryName,deviceTypeName,validStartTime,orderIndex",
            tenantId = '377ec8c660f74f95a13f059049877fcb',
            userId = 'b1a14052512e4648b015812eef2b50e9';
        switch (exportType){
            case 'rows':
                return {
                    authParam:{
                        tenantId,
                        userId,
                    },
                    param:{
                        ...{aa:111,bb:222},
                        columnNames,
                        columnFields,
                        downloadAll: false,
                        downloadIds: [1,2,3,4,5]
                    },
                };
            case 'page':
                return {
                    authParam:{
                        tenantId,
                        userId,
                    },
                    param:{
                        ...{aa:111,bb:222},
                        columnNames,
                        columnFields,
                        downloadAll: false,
                        downloadIds: [1,2,3,4,5]
                    },
                };
            case 'all':
                return {
                    authParam:{
                        tenantId,
                        userId,
                    },
                    param:{
                        ...{aa:111,bb:222},
                        columnNames,
                        columnFields,
                        downloadAll: true,
                    },
                };
        }
    }
}

  return (
    <div className={styles.normal}>
      <VtxExport {...exportProps}/>
      <h1 className={styles.title}>Yay! Welcome to dva!</h1>
      <div className={styles.welcome} />
      <ul className={styles.list}>
        <li>To get started, edit <code>src/index.js</code> and save to reload.</li>
        <li><a href="https://github.com/dvajs/dva-docs/blob/master/v1/en-us/getting-started.md">Getting Started</a></li>
      </ul>
      {/* <VtxInput></VtxInput> */}
    </div>
  );
}

IndexPage.propTypes = {
};

export default connect()(IndexPage);
