export interface ViteMockOptions {
  mockPath?: string;
  configPath?: string;
  ignore?: RegExp | ((fileName: string) => boolean);
  watchFiles?: boolean;
  localEnabled?: boolean;
  prodEnabled?: boolean;
  injectFile?: string;
  injectCode?: string;
  supportTs?: boolean;
  logger?: boolean;
}

export type MethodType = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type Recordable<T = any> = Record<string, T>;

export declare interface MockMethod {
  url: string;
  method?: MethodType;
  timeout?: number;
  statusCode?: number;
  response: ((opt: { body: Recordable; query: Recordable; headers: Recordable }) => any) | any;
}

export interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}
