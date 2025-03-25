import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Unocss from 'unocss/vite'

export default defineConfig({
  base: './',

  resolve: {
    alias: {
      '~/': __dirname,
    },
  },

  plugins: [
    Vue(),
    Unocss(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],

  build: {
    target: 'esnext',
    outDir: resolve(__dirname, '../../dist/inspect'),
    minify: false, // 'esbuild',
    emptyOutDir: true,
  },
})
