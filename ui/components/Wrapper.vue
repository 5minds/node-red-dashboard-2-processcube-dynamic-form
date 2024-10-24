<template>
  <div ref="reactRoot"></div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue';
import React from 'react';
import { createRoot } from 'react-dom/client';
import UIDynamicForm from './UIDynamicForm.jsx'; 

export default defineComponent({
  name: 'UIDynamicForm',
  setup() {
    const reactRoot = ref(null);

    onMounted(() => {
      const root = createRoot(reactRoot.value);
      root.render(React.createElement(UIDynamicForm));
    });

    return {
      reactRoot,
    };
  },
});
</script>

<style>
</style>
