import fs from 'fs'

const toString = Object.prototype.toString

export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`
}

// eslint-disable-next-line
export function isFunction<T = Function>(val: unknown): val is T {
  return is(val, 'Function') || is(val, 'AsyncFunction')
}

export function isArray(val: any): val is Array<any> {
  return val && Array.isArray(val)
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp')
}

export function isAbsPath(path: string | undefined) {
  if (!path) {
    return false
  }
  // Windows 路径格式：C:\ 或 \\ 开头，或已含盘符（D:\path\to\file）
  if (/^([a-zA-Z]:\\|\\\\|(?:\/|\uFF0F){2,})/.test(path)) {
    return true
  }
  // Unix/Linux 路径格式：/ 开头
  return /^\/[^/]/.test(path)
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('')
    }, time)
  })
}
