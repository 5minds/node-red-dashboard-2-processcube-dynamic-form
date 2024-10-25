import { DynamicUi } from '@5minds/processcube_app_sdk/client';
import '@5minds/processcube_app_sdk/client/components/DynamicUi/DynamicUi.css';
import React, { useState } from 'react';

export default function UIDynamicForm(props) {
    const [usertask, setUsertask] = useState(undefined)
    props.socket.on('widget-load:' + props.id, (msg) => {
        setUsertask(msg.payload.userTask)
    })
    props.socket.on('msg-input:' + props.id, (msg) => {
        setUsertask(msg.payload.userTask)
    })

    if (!usertask) {
        return <h1>no task to show</h1>
    }
    
    return <DynamicUi task={usertask as any} onSubmit={() => console.log("submit...") as any} />;
}

