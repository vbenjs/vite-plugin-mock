(async () => {
  try {
    await import('mockjs');
  } catch (e) {
    throw new Error('vite-plugin-vue-mock requires mockjs to be present in the dependency tree.');
  }
})();

import type { ViteMockOptions } from './types';
import type { Plugin } from 'vite';

import { ResolvedConfig, normalizePath } from 'vite';
import { createMockServer, requestMiddle } from './createMockServer';
import path from 'path';

export function viteMockServe(opt: ViteMockOptions): Plugin {
  const { supportTs = true } = opt;
  const {
    injectFile = normalizePath(path.resolve(process.cwd(), `src/main.${supportTs ? 'ts' : 'js'}`)),
  } = opt;

  let isDev = false;

  let config: ResolvedConfig;

  let needSourcemap = false;

  return {
    name: 'vite:mock',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isDev = config.command === 'serve' && !config.isProduction;
      needSourcemap = !!resolvedConfig.build.sourcemap;
    },

    configureServer: async ({ middlewares }) => {
      const { localEnabled = isDev } = opt;
      if (!localEnabled) {
        return;
      }

      createMockServer(opt);

      const middleware = await requestMiddle(opt);
      middlewares.use(middleware);
    },

    async transform(code: string, id: string) {
      if (isDev || !id.endsWith(injectFile)) {
        return null;
      }

      const { prodEnabled = true, injectCode = '' } = opt;
      if (!prodEnabled) {
        return null;
      }

      return {
        map: needSourcemap ? this.getCombinedSourcemap() : null,
        code: `${code}\n${injectCode}`,
      };
    },
  };
}

export * from './types';
