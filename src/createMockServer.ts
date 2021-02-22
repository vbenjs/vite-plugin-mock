import type { ViteMockOptions, MockMethod } from './types';
import { existsSync } from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import url from 'url';
import fg from 'fast-glob';
import Mock from 'mockjs';

import {
  isArray,
  isFunction,
  sleep,
  isRegExp,
  isBoolean,
  loadConfigFromBundledFile,
} from './utils';
import { rollup } from 'rollup';
import esbuildPlugin from 'rollup-plugin-esbuild';
import dayjs from 'dayjs';

import createServer, { NextHandleFunction } from 'connect';

const pathResolve = require('@rollup/plugin-node-resolve');

export let mockData: MockMethod[] = [];

export async function createMockServer(
  opt: ViteMockOptions = { mockPath: 'mock', ignoreFiles: [], configPath: 'vite.mock.config' }
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

function getInvokeTime(opt: ViteMockOptions): string {
  const { showTime } = opt;
  const defTime = ` - ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
  if (isBoolean(showTime)) {
    return !showTime ? '' : defTime;
  }
  if (!showTime) return '';

  try {
    return dayjs().format(showTime);
  } catch (error) {
    return defTime;
  }
}

// request match
// @ts-ignore
export async function requestMiddle(opt: ViteMockOptions) {
  const middleware: NextHandleFunction = async (req, res, next) => {
    let queryParams: {
      query?: {
        [key: string]: any;
      };
      pathname?: string | null;
    } = {};

    const isGet = req.method === 'GET';
    if (isGet && req.url) {
      queryParams = url.parse(req.url, true);
    }

    const matchReq = mockData.find((item) => {
      if (isGet) {
        return item.url === queryParams.pathname;
      }
      return item.url === req.url;
    });
    if (matchReq) {
      const { response, timeout, statusCode } = matchReq;

      if (timeout) {
        await sleep(timeout);
      }
      const { query = {} } = queryParams;

      const body = (await parseJson(req)) as Record<string, any>;
      const mockRes = isFunction(response) ? response({ body, query }) : response;
      console.log(
        `${chalk.cyan(`[vite:mock-server]`)}` +
          `${chalk.dim(':request invoke:')}` +
          ` ${chalk.green(req.url)}` +
          `${chalk.dim(getInvokeTime(opt))}`
      );
      res.setHeader('Content-Type', 'application/json');

      res.statusCode = statusCode || 200;

      res.end(JSON.stringify(Mock.mock(mockRes)));
      return;
    }
    next();
  };
  return middleware;
}

// create watch mock
function createWatch(opt: ViteMockOptions) {
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
      console.log(
        `${chalk.cyan(`[vite:mock-server]`)}` +
          `${chalk.dim(` - mock file ${event}: `)}` +
          `${chalk.dim(`[${file}]`)}` +
          `${chalk.dim(getInvokeTime(opt))}`
      );
      mockData = await getMockConfig(opt);
    });
  };
  return watch;
}

// clear cache
function cleanRequireCache(opt: ViteMockOptions) {
  const { absConfigPath, absMockPath } = getPath(opt);
  Object.keys(require.cache).forEach((file) => {
    if (file === absConfigPath || file.indexOf(absMockPath) > -1) {
      delete require.cache[file];
    }
  });
}

function parseJson(req: createServer.IncomingMessage) {
  return new Promise((resolve) => {
    let body = '';
    let jsonStr = '';
    req.on('data', function (chunk) {
      body += chunk;
    });
    req.on('end', function () {
      try {
        jsonStr = JSON.parse(body);
      } catch (err) {
        jsonStr = '';
      }
      resolve(jsonStr);
      return;
    });
  });
}

// load mock .ts files and watch
async function getMockConfig(opt: ViteMockOptions) {
  cleanRequireCache(opt);
  const { absConfigPath, absMockPath } = getPath(opt);
  const { ignoreFiles = [], ignore, configPath, supportTs } = opt;
  let ret: any[] = [];
  if (configPath && existsSync(absConfigPath)) {
    console.log(
      `${chalk.cyan(`[vite:mock-server]`)}` +
        `${chalk.dim(` - load mock data from: `)}` +
        `${chalk.dim(`[${absConfigPath}]`)}` +
        `${chalk.dim(getInvokeTime(opt))}`
    );
    let resultModule = await resolveModule(absConfigPath);
    ret = resultModule;
  } else {
    const mockFiles = fg
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
      console.log(
        `${chalk.cyan(`[vite:mock-server]`)}` +
          `${chalk.red(` - mock reload error: `)}` +
          `${chalk.red(`[${error}]`)}` +
          `${chalk.dim(getInvokeTime(opt))}`
      );
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
    extensions: ['.js', '.ts'],
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
function getPath(opt: ViteMockOptions) {
  const { mockPath, configPath } = opt;
  const cwd = process.cwd();
  const absMockPath = join(cwd, mockPath || '');
  const absConfigPath = join(cwd, configPath || '');
  return {
    absMockPath,
    absConfigPath,
  };
}
