import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { defineConfig, } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const LIBRARY_NAME = 'ui-dynamic-form';

export default defineConfig(
     {
        plugins: [vue(), cssInjectedByJsPlugin(), react(), nodePolyfills()],
        build: {
            lib: {
                entry: resolve(__dirname, 'ui/components/UIDynamicForm.vue'),
                name: LIBRARY_NAME,
                formats: ['umd'],
                fileName: (format, entryName) => `${LIBRARY_NAME}.${format}.js`,
            },
            outDir: './resources',
            rollupOptions: {
                external: ['vue', 'vuex'],
                output: {
                    globals: {
                        vue: 'Vue',
                        vuex: 'vuex',
                        react: 'React',
                        'react-dom': 'ReactDOM',
                    },
                },
            },
        },
    }
);
