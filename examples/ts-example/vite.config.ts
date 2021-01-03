import { viteMockServe } from 'vite-plugin-mock';

import { UserConfigExport, ConfigEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default ({ command }: ConfigEnv): UserConfigExport => {
  return {
    plugins: [
      vue(),
      viteMockServe({
        // default
        mockPath: 'mock',
        localEnabled: command === 'serve',
      }),
    ],
  };
};
