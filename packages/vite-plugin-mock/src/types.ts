import { IncomingMessage, ServerResponse } from 'http'

export interface ViteMockOptions {
  mockPath?: string
  configPath?: string
  ignore?: RegExp | ((fileName: string) => boolean)
  watchFiles?: boolean
  enable?: boolean
  logger?: boolean
  cors?: boolean
}

export interface RespThisType {
  req: IncomingMessage
  res: ServerResponse
  parseJson: () => any
}

export type MethodType = 'get' | 'post' | 'put' | 'delete' | 'patch'

export type Recordable<T = any> = Record<string, T>

export declare interface MockMethod {
  url: string
  method?: MethodType
  timeout?: number
  statusCode?: number
  response?:
    | ((
        this: RespThisType,
        opt: { url: Recordable; body: Recordable; query: Recordable; headers: Recordable, req: IncomingMessage, res: ServerResponse },
      ) => any)
    | any
  rawResponse?: (this: RespThisType, req: IncomingMessage, res: ServerResponse) => void
}

export interface MockConfig {
  env: Record<string, any>
  mode: string
  command: 'build' | 'serve'
}
