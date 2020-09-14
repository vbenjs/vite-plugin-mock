import { UserConfig } from 'vite';
import { createMockServer } from 'vite-plugin-mock';

const config: UserConfig = {
  plugins: [
    createMockServer({
      // default
      mockPath: 'mock',
    }),
  ],
};
export default config;
