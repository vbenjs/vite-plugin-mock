import path from 'path';

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}
export async function loadConfigFromBundledFile(fileName: string, bundledCode: string) {
  const extension = path.extname(fileName);
  const defaultLoader = require.extensions[extension]!;
  require.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === fileName) {
      (module as NodeModuleWithCompile)._compile(bundledCode, filename);
    } else {
      defaultLoader(module, filename);
    }
  };
  delete require.cache[fileName];
  const raw = require(fileName);
  const config = raw.__esModule ? raw.default : raw;
  require.extensions[extension] = defaultLoader;
  return config;
}
