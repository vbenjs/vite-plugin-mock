import type { CreateMock, MockMethod } from './types';
import { ParameterizedContext, Context, DefaultState } from 'koa';
import { existsSync } from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import glob from 'glob';
import Mock from 'mockjs';
import { isArray, isFunction, sleep, isRegExp } from './utils';
import { loadConfigFromBundledFile } from './loadConfigFromBundledFile';
import { rollup } from 'rollup';
import esbuildPlugin from 'rollup-plugin-esbuild';
const pathResolve = require('@rollup/plugin-node-resolve');

let mockData: MockMethod[] = [];
export async function createMockServer(
  opt: CreateMock = { mockPath: 'mock', ignoreFiles: [], configPath: 'vite.mock.config' }
) {
  opt = {
    mockPath: 'mock',
    ignoreFiles: [],
    watchFiles: true,
    supportTs: true,
    configPath: 'vite.mock.config.ts',
    ...opt,
  };
  if (mockData.length > 0) return;
  mockData = await getMockConfig(opt);
  const { watchFiles = true } = opt;
  if (watchFiles) {
    const watch = await createWatch(opt);
    watch && watch();
  }
}
export function getMockData() {
  return mockData;
}

// request match
export async function requestMiddle(ctx: ParameterizedContext<DefaultState, Context>, next: any) {
  const path = ctx.path;
  const req = mockData.find((item) => item.url === path);
  if (req) {
    const { response, timeout } = req;
    if (timeout) {
      await sleep(timeout);
    }
    const { body, query } = ctx.request;
    const mockRes = isFunction(response) ? response({ body, query }) : response;
    console.log(`${chalk.green('[vite:mock-server]:request invoke: ' + ` ${chalk.cyan(path)} `)}`);
    ctx.type = 'json';
    ctx.status = 200;

    ctx.body = Mock.mock(mockRes);
    return;
  }
  await next();
}

// create watch mock
function createWatch(opt: CreateMock) {
  const { configPath } = opt;
  const { absConfigPath, absMockPath } = getPath(opt);
  if (process.env.VITE_DISABLED_WATCH_MOCK === 'true') return;
  const watchDir = [];
  const exitsConfigPath = existsSync(absConfigPath);

  exitsConfigPath && configPath ? watchDir.push(absConfigPath) : watchDir.push(absMockPath);

  const watcher = chokidar.watch(watchDir, {
    ignoreInitial: true,
  });

  const watch = () => {
    watcher.on('all', async (event, file) => {
      console.log(chalk.magentaBright(`[vite:mock-server]:mock file ${event}.`));
      mockData = await getMockConfig(opt);
    });
  };
  return watch;
}

// clear cache
function cleanRequireCache(opt: CreateMock) {
  const { absConfigPath, absMockPath } = getPath(opt);
  Object.keys(require.cache).forEach((file) => {
    if (file === absConfigPath || file.indexOf(absMockPath) > -1) {
      delete require.cache[file];
    }
  });
}

// load mock .ts files and watch
async function getMockConfig(opt: CreateMock) {
  cleanRequireCache(opt);
  const { absConfigPath, absMockPath } = getPath(opt);
  const { ignoreFiles = [], ignore, configPath, supportTs } = opt;
  let ret: any[] = [];
  if (configPath && existsSync(absConfigPath)) {
    console.log(chalk.blue(`[vite:mock-server]:load mock data from ${absConfigPath}`));
    let resultModule = await resolveModule(absConfigPath);
    ret = resultModule;
  } else {
    const mockFiles = glob
      .sync(`**/*.${supportTs ? 'ts' : 'js'}`, {
        cwd: absMockPath,
        ignore: ignoreFiles,
      })
      .filter((item) => {
        if (!ignore) {
          return true;
        }
        if (isFunction(ignore)) {
          return ignore(item);
        }
        if (isRegExp(ignore)) {
          return !ignore.test(item);
        }
        return true;
      });
    try {
      ret = [];
      for (let index = 0; index < mockFiles.length; index++) {
        const mockFile = mockFiles[index];
        const resultModule = await resolveModule(join(absMockPath, mockFile));
        let mod = resultModule;

        if (!isArray(mod)) {
          mod = [mod];
        }
        ret = [...ret, ...mod];
      }
    } catch (error) {
      console.log(`${chalk.red('[vite:mock-server]:mock reload error!')}\n${error}`);
      ret = [];
    }
  }
  return ret;
}

// Inspired by vite
// support mock .ts files
async function resolveModule(path: string): Promise<any> {
  // use node-resolve to support .ts files
  const nodeResolve = pathResolve.nodeResolve({
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  });
  const bundle = await rollup({
    input: path,
    treeshake: false,
    plugins: [
      esbuildPlugin({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        sourceMap: false,
      }),
      nodeResolve,
    ],
  });

  const {
    output: [{ code }],
  } = await bundle.generate({
    exports: 'named',
    format: 'cjs',
  });

  return await loadConfigFromBundledFile(path, code);
}

// get custom config file path and mock dir path
function getPath(opt: CreateMock) {
  const { mockPath, configPath } = opt;
  const cwd = process.cwd();
  const absMockPath = join(cwd, mockPath || '');
  const absConfigPath = join(cwd, configPath || '');
  return {
    absMockPath,
    absConfigPath,
  };
}
