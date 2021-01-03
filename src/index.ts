import { ViteMockOptions } from './types';
import { Plugin, ResolvedConfig } from 'vite';
import { createMockServer, requestMiddle } from './createMockServer';
import bodyParser from 'body-parser';
export function viteMockServe(opt: ViteMockOptions): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'vite:mock',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer: ({ app }) => {
      const { localEnabled = config.command === 'serve' } = opt;
      if (!localEnabled) return;
      createMockServer(opt);
      // parse application/x-www-form-urlencoded
      app.use(bodyParser.urlencoded({ extended: false }));
      // parse application/json
      app.use(bodyParser.json());
      app.use(requestMiddle(app, opt));
    },
  };
}

export * from './types';
