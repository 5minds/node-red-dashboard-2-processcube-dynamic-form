import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const LIBRARY_NAME = "ui-dynamic-form";

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  define: {
    'process.env': {}
  },
  build: {
    lib: {
      entry: resolve(__dirname, "ui/components/Wrapper.vue"),
      name: LIBRARY_NAME,
      formats: ["umd"],
      fileName: (format, entryName) => `${LIBRARY_NAME}.${format}.js`,
    },
    outDir: "./resources",
    rollupOptions: {
      external: ["vue", "vuex", "react", "react-dom"], 
      output: {
        globals: {
          vue: "Vue",
          vuex: "vuex",
          react: "React", 
          "react-dom": "ReactDOM", 
        },
      },
    },
  },
});
