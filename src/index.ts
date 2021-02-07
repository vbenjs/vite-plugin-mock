import { ViteMockOptions } from './types';
import { Plugin, ResolvedConfig, normalizePath } from 'vite';
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
      needSourcemap =
        resolvedConfig.command === 'serve' ||
        (resolvedConfig.isProduction && !!resolvedConfig.build.sourcemap);
    },

    configureServer: async ({ middlewares }) => {
      const { localEnabled = isDev } = opt;
      if (!localEnabled) return;
      createMockServer(opt);

      const middleware = await requestMiddle(opt);
      middlewares.use(middleware);
    },
    async transform(code: string, id: string) {
      const getResult = (content: string) => ({
        map: needSourcemap ? this.getCombinedSourcemap() : null,
        code: content,
      });

      if (isDev || !id.endsWith(injectFile)) {
        return getResult(code);
      }
      const { prodEnabled = true, injectCode = '' } = opt;
      if (!prodEnabled) {
        return getResult(code);
      }
      return getResult(`
      ${code}
      \n
      ${injectCode}
      `);
    },
  };
}

export * from './types';
