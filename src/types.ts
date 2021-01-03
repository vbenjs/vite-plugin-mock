export interface ViteMockOptions {
  mockPath?: string;
  configPath?: string;
  ignoreFiles?: string[];
  ignore?: RegExp | ((fileName: string) => boolean);
  watchFiles?: boolean;
  localEnabled?: boolean;
  supportTs?: boolean;
  showTime?: boolean | string;
}

export type MethodType = 'get' | 'post' | 'put' | 'delete' | 'patch';

export declare interface MockMethod {
  url: string;
  method?: MethodType;
  timeout?: number;
  statusCode?: number;
  response: ((opt: { body: Record<string, any>; query: Record<string, any> }) => any) | object;
}
