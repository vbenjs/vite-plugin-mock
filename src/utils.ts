const toString = Object.prototype.toString;

export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`;
}

// eslint-disable-next-line
export function isFunction<T = Function>(val: unknown): val is T {
  return is(val, 'Function');
}

export function isArray(val: any): val is Array<any> {
  return val && Array.isArray(val);
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp');
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('');
    }, time);
  });
}
