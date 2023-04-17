import { viteMockServe } from 'vite-plugin-mock'

import vue from '@vitejs/plugin-vue'

export default ({ command }) => {
  let prodMock = true
  return {
    plugins: [
      vue(),
      viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),
    ],
  }
}
