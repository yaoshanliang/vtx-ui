import React from 'react';
import './VtxModalList.less';
import Tooltip from 'antd/lib/tooltip';
import 'antd/lib/tooltip/style/css';
import Icon from 'antd/lib/icon';
import 'antd/lib/icon/style/css';
// import jq from 'jquery';

class VtxModalList extends React.Component{
    constructor(props){
        super(props);
        this.repeteList = {};
        this.state = {
            //新增时不做验证判断.
            isRequired: props.isRequired || false,
            isRefresh: 0,
            repeteLoading: []
        }
    }
    componentWillReceiveProps(nextProps) {//已加载组件，收到新的参数时调用
        let t = this;
        if(t.props.visible != nextProps.visible){
            t.setState({
                isRequired : nextProps.isRequired
            });
        }
    }
    /*
        重复验证 ajax
        options:
        url 请求地址
        body 请求参数
        method 请求方式 默认 post
        返回数据格式: 
        {
            msg: '',
            //0接口成功,1接口失败
            result: 0,
            //true不重复,false 重复
            data: true
        }

     */
    repeteAjax(options = {}){
        let ajaxPropmise = new Promise((resolve,reject)=>{
            $.ajax({
                type: options.method || 'post',
                url: options.url || '',
                data: options.body || null,
                dataType:'json',
                async: true,
                success: function (data) {
                    resolve(data);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown){ 
                    reject(textStatus);
                }
            });
        });
        return ajaxPropmise.then(data => ({data}))
        .catch(err=>{
            return new Promise((resolve,reject)=>{
                resolve({result:1,data:false});
            })
        });
    }
    //处理props.children
    renderChildren(){
        let t = this;
        let chil = t.props.children;
        if(!!chil){
            if(!chil.length){
                return t.cloneComponent(this.props.children);
            }else{
                let elems = chil.map((item,index)=>{
                    if(!!item){
                        return t.cloneComponent(item,index);
                    }else{
                        return item;
                    }
                });
                return elems;
            }
        }
    }
    /*
        复制Element对象,并做重复功能处理
        input特殊处理onChange事件,增加正则判断
        select,input,treeSelect做非空验证处理
     */
    cloneComponent(elem,index){
        let t = this,
            mld = elem.props['data-modalList'] || {},
            reg = mld.regexp || {};
        let ty = (mld.layout || {}).type || 'default';
        let isInherit = ()=>{
            if(typeof(elem.type) == 'function'){
                switch(elem.type.name.toLocaleLowerCase()){
                    case 'stateinput':
                        return true;
                    break;
                    case 'stateselect':
                        return true;
                    break;
                    case 'vtxtreeselect':
                        return true;
                    break;
                    case 'vtxyearpicker':
                        return true;
                    break;
                }
            }
            return false;
        }
        let e = React.cloneElement(elem,{
            ...elem.props,
            'data-modalList': '',
            style:{
                ...elem.props.style,
                width: '100%'
            },
            //样式小问题解决
            ...(isInherit()?{inherit:true}:{}),
            //失交验重
            ...(
                typeof(elem.type) == 'function' && 
                    elem.type.name.toLocaleLowerCase().indexOf('input')?
                {onBlur: (e)=>{
                    if('onBlur' in elem.props &&
                        typeof(elem.props.onBlur) == 'function'){
                        elem.props.onBlur(e);
                    }
                    if(reg.repete && e.target.value){
                        t.setState({
                            repeteLoading: [index]
                        })
                        t.repeteAjax({
                            url: (reg.repete || {}).url || '',
                            body: (reg.repete || {}).key || null
                        }).then(({data})=>{
                            t.repeteList[index] = {
                                ...t.repeteList[index],
                                isRepete: data.data
                            }
                            t.setState({
                                //刷新用
                                isRefresh: +t.state.isRefresh,
                                repeteLoading: []
                            })
                        })
                    }
                }}:{}
            ),
            //onChange事件 存在时做验证
            ...(
                typeof(elem.type) == 'function' && 
                    elem.type.name.toLocaleLowerCase().indexOf('input') > -1 && 
                    'onChange' in elem.props &&
                    typeof(elem.props.onChange) == 'function'?
                {onChange: (e)=>{
                    let value = e.target.value,
                        required = true;
                    if(!!reg.exp){
                        if(reg.exp instanceof RegExp){
                            required = reg.exp.test(value);
                        }else if(reg.exp instanceof Function){
                            required = reg.exp(value);
                        }else{
                            console.error('参数reg: 格式不是验证方法或正则表达式!');
                        }
                    }
                    if(required || value === ''){
                        elem.props.onChange(e);
                    }
                }}:{}
            )
        });
        t.repeteList[index] = {
            isRepete: false,//是否重复
            ...(t.repeteList[index] || {}),//记录 重复验证信息
            ...reg,
            mld,
            type: ty,
            elem: e
        }
        let {required,errorMsg} = t.verify(reg.value,mld,index);
        return (
            <LayoutComponent 
                key={index} 
                {...((elem.props['data-modalList'] || {}).layout || {})}
            >   
                {
                    ty == 'default'?
                    <VerificationComponent 
                        required={required}
                        errorMsg={errorMsg}
                        isLoading={t.state.repeteLoading.indexOf(index) > -1}
                    >
                        {e}
                        {
                            t.state.repeteLoading.indexOf(index) > -1?
                            <Icon type="loading" className={'vtx-ui-modallist-loading-icon'}/>:''
                        }
                    </VerificationComponent>:
                    e
                }
            </LayoutComponent>
        )
    }
    //数据验证展示
    verify(value='',mld,index){
        let t = this,
            isRequired = t.state.isRequired,
            reg = mld.regexp || {};
        let required = true,errorMsg = '';
        /*
            值为空时,不验证重复,验证是否为空等
            值不为空时,验证重复,和验证其他状态
         */
        if(!value && (mld.layout || {}).require){
            //全局判断是不是不验证状态 isRequired==true时不执行验证
            if(!isRequired){
                required = false;
                errorMsg = '必填项';
            }
        }else{
            //判断是否重复
            if(t.repeteList[index].isRepete){
                required = false;
                errorMsg = '字段重复';
            }else{
                if(!!reg.exp && !isRequired && value){
                    if(reg.exp instanceof RegExp){
                        required = reg.exp.test(value);
                        errorMsg = '数据不符合规范';
                    }else if(reg.exp instanceof Function){
                        required = reg.exp(value);
                        errorMsg = '数据不符合规范';
                    }else{
                        console.error('参数reg: 格式不是验证方法或正则表达式!');
                    }
                }
            }
        }
        return {required,errorMsg};
    }
    //外部调用 清空验证的方法
    clear(){
        let t = this;
        for (let i in t.repeteList) {
            t.repeteList[i].isRepete = false;
        }
        t.setState({
            isRequired: true
        })
    }
    //外部调用 保存前的统一验证方法
    //返回Promise 
    submit(){
        let t = this;
        t.setState({
            isRequired: false
        })
        return new Promise((resolve,reject)=>{
            //先做正则判断,避免发送多余请求
            for(let i in t.repeteList){
                let r = t.repeteList[i];
                if(r.type == 'default'){
                    //重新验证一遍
                    //必填项 值为空
                    if((r.mld.layout || {}).require && !r.value){
                        resolve(false);
                        break;
                    }
                    //有值  做正则判断
                    if(r.value){
                        let reg = r.mld.regexp || {},required =true;
                        if(!!reg.exp){
                            if(reg.exp instanceof RegExp){
                                required = reg.exp.test(r.value);
                            }else if(reg.exp instanceof Function){
                                required = reg.exp(r.value);
                            }else{
                                console.error('参数reg: 格式不是验证方法或正则表达式!');
                            }
                        }
                        //正则不匹配 跳过
                        if(!required){
                            resolve(false);
                            break;
                        }
                    }
                }
            }
            resolve(true);
        }).then(data=>{
            if(data){
                //正则判断完后,再发送请求,确认是否重复
                let plist = [],ii = [];
                for(let i in t.repeteList){
                    let r = t.repeteList[i];
                    if(r.type == 'default' && r.repete){
                        let p = t.repeteAjax({
                            url: (r.repete || {}).url || '',
                            body: (r.repete || {}).key || null
                        });
                        plist.push(p);
                        ii.push(i);
                    }
                }
                return Promise.all(plist).then(values=>{
                    let isRequest = true;
                    for(let i = 0 ; i < values.length; i++){
                        if(values[i].data.data){
                            t.repeteList[ii[i]] = {
                                ...t.repeteList[ii[i]],
                                isRepete: values[i].data.data
                            }
                            isRequest = false;
                        }
                    }
                    return new Promise((resolve,reject)=>{
                        t.setState({
                            isRefresh: +t.state.isRefresh
                        })
                        resolve(isRequest);
                    })
                })
            }else{
                return new Promise((resolve,reject)=>{
                    resolve(false);
                })
            }
        })
    }
    render(){
        let t = this;
        return (
            <div className='vtx-ui-modallist-lists'>
                {
                    t.renderChildren()
                }
            </div>
        )
    }
}
/*
    验证布局
    required 是否验证错误
    errorMsg 错误提示信息
 */
function VerificationComponent(props){
    let {required,errorMsg = '',isLoading,children} = props;
    return (
        <div 
            className={`${required || isLoading?'vtx-ui-modallist-verificat':'vtx-ui-modallist-error'}`}
            data-errorMsg={errorMsg}
        >
            {children}
            {
                required || isLoading?'':
                <Icon type="close-circle" className={'vtx-ui-modallist-error-icon'}/>
            }
        </div>
    )
}
/*
    layout 弹框布局
    children 子节点
    name 字段名称
    require 是否必填
    width 宽度占比
    className 自定义样式
    type 展示类型
    style 自定义内连样式
 */
function LayoutComponent(props) {
    let {children,name,require,width,className,type = 'default',style={}} = props;
    width = type == 'title'?100:width;
    return (
        <div 
            className={`${name?'vtx-ui-modallist-list_pl':'vtx-ui-modallist-list_p0'} ${type == 'title'?'vtx-ui-modallist-list-title':''} ${className}`}
            style={{...style,width:(width+'%')}}
        >
            {
                name?
                    <Tooltip placement="top" title={name}>
                        <span className={`vtx-ui-modallist-list-left`} data-mh={'：'}>
                            {
                                require?
                                <span className={`vtx-ui-modallist-list-require`}>*</span>
                                :''
                            }
                            {
                                name
                            }
                        </span>
                    </Tooltip>
                :''
            }
            {
                type == 'text' || type == 'title'?
                <span className={`vtx-ui-modallist-list-right-text`}>
                    {children}
                </span>:''
            }
            {
                type == 'default'?
                <div className={`vtx-ui-modallist-list-right`}>
                    {children}
                </div>:''
            }
        </div>
    )
}
export default VtxModalList;