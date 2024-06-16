/**
 * Used only for development (via `npm run dev`).
 *
 * This file is useful for testing your component in isolation from Node-RED.
 */
import { createApp } from 'vue'

import DynamicForm from './components/DynamicForm.vue'

createApp(DynamicForm).mount('#app')
