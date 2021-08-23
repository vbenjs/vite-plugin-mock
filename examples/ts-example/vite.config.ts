import { viteMockServe } from '../../dist/index'

import { UserConfigExport, ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default ({ command }: ConfigEnv): UserConfigExport => {
  const prodMock = true
  return {
    plugins: [
      vue(),
      viteMockServe({
        mockPath: 'mock',
        localEnabled: command === 'serve',
        prodEnabled: command !== 'serve' && prodMock,
        injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
        logger: true,
      }),
    ],
  }
}
