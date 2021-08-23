# vite-plugin-mock

**English** | [中文](./README.zh_CN.md)

[![npm][npm-img]][npm-url] [![node][node-img]][node-url]

Provide local and prod mocks for vite.

A mock plugin for vite, developed based on mockjs. And support the local environment and production environment at the same time. Connect service middleware is used locally, mockjs is used online

### Install (yarn or npm)

**node version:** >=12.0.0

**vite version:** >=2.0.0

```bash
yarn add mockjs
# or
npm i  mockjs -S
```

```bash
yarn add vite-plugin-mock -D
# or
npm i vite-plugin-mock -D
```

### Example

**Run Example**

```bash

# ts example
cd ./examples/ts-examples

yarn install

yarn serve

# js example

cd ./examples/js-examples

yarn install

yarn serve
```

## Usage

**Development environment**

The development environment is implemented using Connect middleware。

Different from the production environment, you can view the network request record in the Google Chrome console

- Config plugin in vite.config.ts

```ts
import { UserConfigExport, ConfigEnv } from 'vite'

import { viteMockServe } from 'vite-plugin-mock'
import vue from '@vitejs/plugin-vue'

export default ({ command }: ConfigEnv): UserConfigExport => {
  return {
    plugins: [
      vue(),
      viteMockServe({
        // default
        mockPath: 'mock',
        localEnabled: command === 'serve',
      }),
    ],
  }
}
```

- viteMockServe Options

```ts
{
    mockPath?: string;
    supportTs?: boolean;
    ignore?: RegExp | ((fileName: string) => boolean);
    watchFiles?: boolean;
    localEnabled?: boolean;
    ignoreFiles?: string[];
    configPath?: string;
    prodEnabled?: boolean;
    injectFile?: string;
    injectCode?: string;
}
```

## Options

### mockPath

**type:** `string`

**default:** `'mock'`

Set the folder where the mock .ts file is stored

If `watchFiles:true`, the file changes in the folder will be monitored. And synchronize to the request result in real time

If configPath has a value, it is invalid

### supportTs

**type:** `boolean`

**default:** `true`

After opening, the ts file module can be read. Note that you will not be able to monitor .js files after opening.

### ignore

**type:** `RegExp | ((fileName: string) => boolean);`

**default:** `undefined`

When automatically reading analog .ts files, ignore files in the specified format

### watchFiles

**type:** `boolean`

**default:** `true`

Set whether to monitor changes in mock .ts files

### localEnabled

**type:** `boolean`

**default:** `command === 'serve'`

Set whether to enable the local mock .ts file, do not open it in the production environment

### prodEnabled

**type:** `boolean`

**default:** `command !=='serve'`

Set whether to enable mock function for packaging

### injectCode

**type:** `string`

**default:**''

If the mock function is enabled in the production environment, that is, `prodEnabled=true`, the code will be injected into the bottom of the file corresponding to `injectFile`. The default is `main.{ts,js}`

The advantage of this is that you can dynamically control whether mock is enabled in the production environment and mock.js will not be packaged when it is not enabled.

If the code is written directly in `main.ts`, no matter whether it is turned on or not, the final package will include `mock.js`

### injectFile

**type:** `string`

**default:** `path.resolve(process.cwd(),'src/main.{ts,js}')`

The file injected by `injectCode` code, the default is `src/main.{ts,js}` in the project root directory

### configPath

**type:** `string`

**default:** `vite.mock.config.ts`

Set the data entry that the mock reads. When the file exists and is located in the project root directory, the file will be read and used first. The configuration file returns an array

### logger

**type:** `boolean`

**default:** `true`

Whether to display the request log on the console

## Mock file example

`/path/mock`

```ts
// test.ts

import { MockMethod } from 'vite-plugin-mock'
export default [
  {
    url: '/api/get',
    method: 'get',
    response: ({ query }) => {
      return {
        code: 0,
        data: {
          name: 'vben',
        },
      }
    },
  },
  {
    url: '/api/post',
    method: 'post',
    timeout: 2000,
    response: {
      code: 0,
      data: {
        name: 'vben',
      },
    },
  },
  {
    url: '/api/text',
    method: 'post',
    rawResponse: async (req, res) => {
      let reqbody = ''
      await new Promise((resolve) => {
        req.on('data', (chunk) => {
          reqbody += chunk
        })
        req.on('end', () => resolve(undefined))
      })
      res.setHeader('Content-Type', 'text/plain')
      res.statusCode = 200
      res.end(`hello, ${reqbody}`)
    },
  },
] as MockMethod[]
```

### MockMethod

```ts
{
  // request url
  url: string;
  // request method
  method?: MethodType;
  // Request time in milliseconds
  timeout?: number;
  // default: 200
  statusCode?:number;
  // response data (JSON)
  response?: ((opt: { [key: string]: string; body: Record<string,any>; query:  Record<string,any>, headers: Record<string, any>; }) => any) | any;
  // response (non-JSON)
  rawResponse?: (req: IncomingMessage, res: ServerResponse) => void;
}

```

### Example (2.0.0 recommended)

Create the `mockProdServer.ts` file

```ts
//  mockProdServer.ts

import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'

// Import your mock .ts files one by one
// If you use vite.mock.config.ts, just import the file directly
// You can use the import.meta.glob function to import all
import testModule from '../mock/test'

export function setupProdMockServer() {
  createProdMockServer([...testModule])
}
```

Config `vite-plugin-mock`

```ts
import { viteMockServe } from 'vite-plugin-mock'

import { UserConfigExport, ConfigEnv } from 'vite'

export default ({ command }: ConfigEnv): UserConfigExport => {
  // According to the project configuration. Can be configured in the .env file
  let prodMock = true
  return {
    plugins: [
      viteMockServe({
        mockPath: 'mock',
        localEnabled: command === 'serve',
        prodEnabled: command !== 'serve' && prodMock,
        injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
      }),
    ],
  }
}
```

## Sample project

[Vben Admin](https://github.com/anncwb/vue-vben-admin)

## Note

- The node module cannot be used in the mock .ts file, otherwise the production environment will fail
- Mock is used in the production environment, which is only suitable for some test environments. Do not open it in the formal environment to avoid unnecessary errors. At the same time, in the production environment, it may affect normal Ajax requests, such as file upload failure, etc.

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite-plugin-mock.svg
[npm-url]: https://npmjs.com/package/vite-plugin-mock
[node-img]: https://img.shields.io/node/v/vite-plugin-mock.svg
[node-url]: https://nodejs.org/en/about/releases/
