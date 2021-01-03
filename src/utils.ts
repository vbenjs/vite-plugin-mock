import path from 'path';
import type { NodeModuleWithCompile } from './types';

const toString = Object.prototype.toString;

export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`;
}

export function isFunction<T = Function>(val: unknown): val is T {
  return is(val, 'Function');
}

export function isArray(val: any): val is Array<any> {
  return val && Array.isArray(val);
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp');
}

export function isNumber(val: unknown): val is number {
  return is(val, 'Number');
}

export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean');
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('');
    }, time);
  });
}

export function param2Obj(url: string) {
  const search = url.split('?')[1];
  if (!search) {
    return {};
  }
  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"')
        .replace(/\+/g, ' ') +
      '"}'
  );
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
