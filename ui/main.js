/**
 * Used only for development (via `npm run dev`).
 *
 * This file is useful for testing your component in isolation from Node-RED.
 */
import { createApp } from 'vue';
import { plugin, defaultConfig } from '@formkit/vue';
import UIDynamicForm from './components/UIDynamicForm.vue';

createApp(UIDynamicForm).use(plugin, defaultConfig).mount('#app');
