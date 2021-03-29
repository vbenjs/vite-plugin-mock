import type { ViteMockOptions, MockMethod } from './types';

import { existsSync } from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import url from 'url';
import fg from 'fast-glob';
import Mock from 'mockjs';
import { rollup } from 'rollup';
import esbuildPlugin from 'rollup-plugin-esbuild';
import { pathToRegexp, match } from 'path-to-regexp';

import { isArray, isFunction, sleep, isRegExp, loadConfigFromBundledFile } from './utils';

import { IncomingMessage, NextHandleFunction } from 'connect';

const pathResolve = require('@rollup/plugin-node-resolve');

export let mockData: MockMethod[] = [];

export async function createMockServer(
  opt: ViteMockOptions = { mockPath: 'mock', configPath: 'vite.mock.config' }
) {
  opt = {
    mockPath: 'mock',
    watchFiles: true,
    supportTs: true,
    configPath: 'vite.mock.config.ts',
    logger: true,
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

// request match
export async function requestMiddle(opt: ViteMockOptions) {
  const { logger = true } = opt;
  const middleware: NextHandleFunction = async (req, res, next) => {
    let queryParams: {
      query?: {
        [key: string]: any;
      };
      pathname?: string | null;
    } = {};

    const isGet = req.method && req.method.toUpperCase() === 'GET';
    if (isGet && req.url) {
      queryParams = url.parse(req.url, true);
    }

    const reqUrl = isGet ? queryParams.pathname : req.url;
    const matchReq = mockData.find((item) => {
      if (!item.url) return;
      if (item.method && item.method.toUpperCase() !== req.method) return false;
      if (!reqUrl) return false;
      return pathToRegexp(item.url).test(reqUrl);
    });

    if (matchReq) {
      const { response, timeout, statusCode, url } = matchReq;

      if (timeout) {
        await sleep(timeout);
      }

      const urlMatch = match(url, { decode: decodeURIComponent });

      let query = queryParams.query;
      if (reqUrl) {
        if (isGet) {
          if (JSON.stringify(query) === '{}') {
            query = (urlMatch(reqUrl) as any).params || {};
          }
        } else {
          query = (urlMatch(reqUrl) as any).params || {};
        }
      }

      const body = (await parseJson(req)) as Record<string, any>;
      const mockRes = isFunction(response)
        ? response({ body, query, headers: req.headers })
        : response;

      logger && loggerOutput('request invoke', req.url!);

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
  const { configPath, logger } = opt;
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
      logger && loggerOutput(`mock file ${event}`, file);

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

function parseJson(req: IncomingMessage) {
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
  const { ignore, configPath, supportTs, logger } = opt;
  let ret: any[] = [];
  if (configPath && existsSync(absConfigPath)) {
    logger && loggerOutput(`load mock data from`, absConfigPath);
    ret = await resolveModule(absConfigPath);
  } else {
    const mockFiles = fg
      .sync(`**/*.${supportTs ? 'ts' : 'js'}`, {
        cwd: absMockPath,
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
      const resolveModulePromiseList = [];
      for (let index = 0; index < mockFiles.length; index++) {
        const mockFile = mockFiles[index];
        resolveModulePromiseList.push(resolveModule(join(absMockPath, mockFile)));
      }

      const loadAllResult = await Promise.all(resolveModulePromiseList);

      for (const resultModule of loadAllResult) {
        let mod = resultModule;

        if (!isArray(mod)) {
          mod = [mod];
        }
        ret = [...ret, ...mod];
      }
    } catch (error) {
      loggerOutput(`mock reload error`, error);
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

function loggerOutput(title: string, msg: string, type: 'info' | 'error' = 'info') {
  const tag =
    type === 'info' ? chalk.cyan.bold(`[vite:mock]`) : chalk.red.bold(`[vite:mock-server]`);
  return console.log(
    `${chalk.dim(new Date().toLocaleTimeString())} ${tag} ${chalk.green(title)} ${chalk.dim(msg)}`
  );
}
