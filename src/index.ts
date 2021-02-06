import { ViteMockOptions } from './types';
import { Plugin, ResolvedConfig, normalizePath } from 'vite';
import { createMockServer, requestMiddle } from './createMockServer';
import bodyParser from 'body-parser';
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
      needSourcemap = resolvedConfig.isProduction && !!resolvedConfig.build.sourcemap;
    },

    configureServer: ({ middlewares }) => {
      const { localEnabled = isDev } = opt;
      if (!localEnabled) return;
      createMockServer(opt);
      // parse application/x-www-form-urlencoded
      middlewares.use(bodyParser.urlencoded({ extended: false }));
      // parse application/json
      middlewares.use(bodyParser.json());
      middlewares.use(requestMiddle(opt));
    },
    async transform(code: string, id: string) {
      const getMap = () => (needSourcemap ? this.getCombinedSourcemap() : null);

      if (isDev || !id.endsWith(injectFile)) {
        return {
          code,
          map: getMap(),
        };
      }
      const { prodEnabled = true, injectCode = '' } = opt;
      if (!prodEnabled) {
        return {
          code,
          map: getMap(),
        };
      }
      return {
        code: `
      ${code}
      \n
      ${injectCode}
      `,
        map: getMap(),
      };
    },
  };
}

export * from './types';
