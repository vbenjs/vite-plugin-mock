import Mock from 'mockjs';

export function createProdMockServer(mockList: any[]) {
  // @ts-ignore
  Mock.XHR.prototype.__send = Mock.XHR.prototype.send;
  // @ts-ignore
  Mock.XHR.prototype.send = function () {
    if (this.custom.xhr) this.custom.xhr.withCredentials = this.withCredentials || false;
    // eslint-disable-next-line
    this.__send.apply(this, arguments);
  };

  for (const { url, method, response, timeout } of mockList) {
    __setupMock__(timeout);
    Mock.mock(new RegExp(url), method || 'get', __XHR2ExpressReqWrapper__(response, timeout));
  }
}

function __param2Obj__(url: string) {
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

function __XHR2ExpressReqWrapper__(handle: (d: any) => any, timeout = 0) {
  return function (options: any) {
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
