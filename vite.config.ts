import { defineConfig } from 'vite'
import { resolve } from "path";
import vue from '@vitejs/plugin-vue'
import path from 'path'

/** 路径查找 */
const pathResolve = (dir: string): string => {
  return resolve(__dirname, ".", dir);
};


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/wandering-earth/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: false,
    // 消除打包大小超过500kb警告
    chunkSizeWarningLimit: 4000,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: pathResolve("index.html")
      },
      // 静态资源分类打包
      output: {
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]"
      }
    }
  },
  server: {
    port: 9888,
    hmr: {
      host: '127.0.0.1',
      port: 9888
    },
    proxy: {}

  }
})
