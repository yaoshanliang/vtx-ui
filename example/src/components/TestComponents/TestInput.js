import React from 'react';


import { Input ,InputNumber } from 'antd';

function TestInput(props) {
    return (
        <Input placeholder="必须加提示" />
    );
}
function TestInputNumber(props) {
    function onChange(){
        
    }
    return (
        <InputNumber style={{ width: '100%' }} placeholder="必须加提示" min={1} max={10} onChange={onChange} />
    );
}
export default {TestInput,TestInputNumber};

