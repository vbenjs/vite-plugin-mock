export interface CreateMock {
  mockPath?: string;
  configPath?: string;
  ignoreFiles?: string[];
  ignore?: RegExp | ((fileName: string) => boolean);
  watchFiles?: boolean;
  localEnabled?: boolean;
}

export type MethodType = 'get' | 'post' | 'put' | 'delete' | 'patch';

export declare interface MockMethod {
  url: string;
  method?: MethodType;
  timeout?: number;
  response: ((opt: { [key: string]: string; body: any; query: any }) => any) | object;
}
