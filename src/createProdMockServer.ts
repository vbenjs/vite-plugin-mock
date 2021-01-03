/*
 * @Description: For use in a production environment. Note that this time the file upload will fail
 */
import Mock from 'mockjs';
import { param2Obj } from './utils';

export function createProdMockServer(mockList: any[]) {
  for (const { url, method, response, timeout } of mockList) {
    setupMock(timeout);
    Mock.mock(new RegExp(url), method || 'get', XHR2ExpressReqWrap(response, timeout));
  }
}

function XHR2ExpressReqWrap(handle: (d: any) => any, timeout = 0) {
  return function (options: any) {
    let result = null;
    if (handle instanceof Function) {
      const { body, type, url } = options;
      result = handle({
        method: type,
        body: JSON.parse(body),
        query: param2Obj(url),
      });
    } else {
      result = handle;
    }

    return Mock.mock(result);
  };
}
function setupMock(timeout = 0) {
  if (timeout) {
    Mock.setup({
      timeout,
    });
  }
}
