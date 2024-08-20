/**
 * Used only for development (via `npm run dev`).
 *
 * This file is useful for testing your component in isolation from Node-RED.
 */
import { createApp } from 'vue';
import { plugin, defaultConfig } from '@formkit/vue';
import '@formkit/themes/genesis';
import UIDynamicForm from './components/UIDynamicForm.vue';

const formkitConfig = defaultConfig({
    theme: 'genesis',
});

createApp(UIDynamicForm).use(plugin, formkitConfig).mount('#app');
