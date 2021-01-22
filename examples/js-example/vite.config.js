import { viteMockServe } from 'vite-plugin-mock';

import vue from '@vitejs/plugin-vue';

export default ({ command }) => {
  let prodMock = true;
  return {
    plugins: [
      vue(),
      viteMockServe({
        // close support .ts file
        supportTs: false,
        // default
        mockPath: 'mock',
        localEnabled: command === 'serve',
        prodEnabled: command !== 'serve' && prodMock,
        injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
      }),
    ],
  };
};
