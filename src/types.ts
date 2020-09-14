export interface CreateMock {
  mockPath?: string;
  configPath?: string;
  ignoreFiles?: string[];
  ignore?: RegExp | ((fileName: string) => boolean);
  watchFiles?: boolean;
  localEnabled?: boolean;
  supportTs?: boolean;
}

export type MethodType = 'get' | 'post' | 'put' | 'delete' | 'patch';

export declare interface MockMethod {
  url: string;
  method?: MethodType;
  timeout?: number;
  response: ((opt: { body: any; query: any }) => any) | object;
}
