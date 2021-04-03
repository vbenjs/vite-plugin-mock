/* eslint-disable */
import mockJs from 'mockjs';
const Mock = mockJs;
export function createProdMockServer(mockList) {
  Mock.XHR.prototype.__send = Mock.XHR.prototype.send;
  Mock.XHR.prototype.send = function () {
    if (this.custom.xhr) {
      this.custom.xhr.withCredentials = this.withCredentials || false;
      if (this.responseType) {
        this.custom.xhr.responseType = this.responseType;
      }
    }
    this.__send.apply(this, arguments);
  };
  Mock.XHR.prototype.proxy_open = Mock.XHR.prototype.open;
  Mock.XHR.prototype.open = function () {
    let responseType = this.responseType;
    this.proxy_open(...arguments);
    if (this.custom.xhr) {
      if (responseType) {
        this.custom.xhr.responseType = responseType;
      }
    }
  };
  for (const { url, method, response, timeout } of mockList) {
    __setupMock__(timeout);
    Mock.mock(new RegExp(url), method || 'get', __XHR2ExpressReqWrapper__(response));
  }
}
function __param2Obj__(url) {
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
function __XHR2ExpressReqWrapper__(handle) {
  return function (options) {
    let result = null;
    if (typeof handle === 'function') {
      const { body, type, url } = options;
      result = handle({
        method: type,
        body: JSON.parse(body),
        query: __param2Obj__(url),
      });
    } else {
      result = handle;
    }
    return Mock.mock(result);
  };
}
function __setupMock__(timeout = 0) {
  timeout &&
    Mock.setup({
      timeout,
    });
}
