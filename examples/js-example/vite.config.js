import { createMockServer } from 'vite-plugin-mock';

const config = {
  plugins: [
    createMockServer({
      // close support .ts file
      supportTs: false,
      // default
      mockPath: 'mock',
    }),
  ],
};
export default config;
