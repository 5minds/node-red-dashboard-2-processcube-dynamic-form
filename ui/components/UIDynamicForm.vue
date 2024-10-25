<template>
    <div ref="reactRoot"></div>
</template>

<script>
import { defineComponent, onMounted, ref, inject } from 'vue';
import React from 'react';
import { createRoot } from 'react-dom/client';
import UIDynamicForm  from './UIDynamicForm.tsx';

export default defineComponent({
    name: 'UIDynamicForm',
    inject: ['$socket'],
    props: {
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: {
            type: Object,
            default: () => ({ enabled: false, visible: false }),
        },
    },
    setup(props) {
        const reactRoot = ref(null);

        const socket = inject('$socket');
        
        onMounted(() => {
            const root = createRoot(reactRoot.value);
            root.render(React.createElement(UIDynamicForm, {...props, socket}));
        });
        return {
            reactRoot,
        };
    },
});
</script>

<style>
</style>
