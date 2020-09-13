import { ServerPlugin } from 'vite';

import { createMockServer, requestMiddle } from './createMockServer';
import { CreateMock } from './types';
import bodyParser from 'koa-bodyparser';

export const createMockServerPlugin = (opt: CreateMock): ServerPlugin => {
  return ({ app }) => {
    app.use(bodyParser());
    createMockServer(opt);
    app.use(requestMiddle);
  };
};
