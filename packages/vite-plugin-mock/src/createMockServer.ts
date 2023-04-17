import type { ViteMockOptions, MockMethod, Recordable, RespThisType } from './types'

import path from 'node:path'
import fs from 'node:fs'
import chokidar from 'chokidar'
import colors from 'picocolors'
import url from 'url'
import fg from 'fast-glob'
import Mock from 'mockjs'
import { pathToRegexp, match } from 'path-to-regexp'
import { isArray, isFunction, sleep, isRegExp, isAbsPath } from './utils'
import { IncomingMessage, NextHandleFunction } from 'connect'
import { bundleRequire } from 'bundle-require'
import type { ResolvedConfig } from 'vite'

export let mockData: MockMethod[] = []

export async function createMockServer(
  opt: ViteMockOptions = { mockPath: 'mock', configPath: 'vite.mock.config' },
  config: ResolvedConfig,
) {
  opt = {
    mockPath: 'mock',
    watchFiles: true,
    configPath: 'vite.mock.config.ts',
    logger: true,
    ...opt,
  }

  if (mockData.length > 0) return
  mockData = await getMockConfig(opt, config)
  await createWatch(opt, config)
}

// request match
export async function requestMiddleware(opt: ViteMockOptions) {
  const { logger = true } = opt
  const middleware: NextHandleFunction = async (req, res, next) => {
    let queryParams: {
      query?: {
        [key: string]: any
      }
      pathname?: string | null
    } = {}

    if (req.url) {
      queryParams = url.parse(req.url, true)
    }

    const reqUrl = queryParams.pathname

    const matchRequest = mockData.find((item) => {
      if (!reqUrl || !item || !item.url) {
        return false
      }
      if (item.method && item.method.toUpperCase() !== req.method) {
        return false
      }
      return pathToRegexp(item.url).test(reqUrl)
    })

    if (matchRequest) {
      const isGet = req.method && req.method.toUpperCase() === 'GET'
      const { response, rawResponse, timeout, statusCode, url } = matchRequest

      if (timeout) {
        await sleep(timeout)
      }

      const urlMatch = match(url, { decode: decodeURIComponent })

      let query = queryParams.query as any
      if (reqUrl) {
        if ((isGet && JSON.stringify(query) === '{}') || !isGet) {
          const params = (urlMatch(reqUrl) as any).params
          if (JSON.stringify(params) !== '{}') {
            query = (urlMatch(reqUrl) as any).params || {}
          } else {
            query = queryParams.query || {}
          }
        }
      }

      const self: RespThisType = { req, res, parseJson: parseJson.bind(null, req) }
      if (isFunction(rawResponse)) {
        await rawResponse.bind(self)(req, res)
      } else {
        const body = await parseJson(req)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = statusCode || 200
        const mockResponse = isFunction(response)
          ? response.bind(self)({ url: req.url as any, body, query, headers: req.headers })
          : response
        res.end(JSON.stringify(Mock.mock(mockResponse)))
      }

      logger && loggerOutput('request invoke', req.url!)
      return
    }
    next()
  }
  return middleware
}

// create watch mock
function createWatch(opt: ViteMockOptions, config: ResolvedConfig) {
  const { configPath, logger, watchFiles } = opt

  if (!watchFiles) {
    return
  }

  const { absConfigPath, absMockPath } = getPath(opt)

  if (process.env.VITE_DISABLED_WATCH_MOCK === 'true') {
    return
  }

  const watchDir = []
  const exitsConfigPath = fs.existsSync(absConfigPath)

  exitsConfigPath && configPath ? watchDir.push(absConfigPath) : watchDir.push(absMockPath)

  const watcher = chokidar.watch(watchDir, {
    ignoreInitial: true,
  })

  watcher.on('all', async (event, file) => {
    logger && loggerOutput(`mock file ${event}`, file)
    mockData = await getMockConfig(opt, config)
  })
}

// clear cache
function cleanRequireCache(opt: ViteMockOptions) {
  if (typeof require === 'undefined' || !require.cache) {
    return
  }
  const { absConfigPath, absMockPath } = getPath(opt)
  Object.keys(require.cache).forEach((file) => {
    if (file === absConfigPath || file.indexOf(absMockPath) > -1) {
      delete require.cache[file]
    }
  })
}

function parseJson(req: IncomingMessage): Promise<Recordable> {
  return new Promise((resolve) => {
    let body = ''
    let jsonStr = ''
    req.on('data', function (chunk) {
      body += chunk
    })
    req.on('end', function () {
      try {
        jsonStr = JSON.parse(body)
      } catch (err) {
        jsonStr = ''
      }
      resolve(jsonStr as any)
      return
    })
  })
}

// load mock .ts files and watch
async function getMockConfig(opt: ViteMockOptions, config: ResolvedConfig) {
  cleanRequireCache(opt)
  const { absConfigPath, absMockPath } = getPath(opt)
  const { ignore, configPath, logger } = opt

  let ret: MockMethod[] = []

  if (configPath && fs.existsSync(absConfigPath)) {
    logger && loggerOutput(`load mock data from`, absConfigPath)
    ret = await resolveModule(absConfigPath, config)
    return ret
  }

  const mockFiles = fg
    .sync(`**/*.{ts,mjs,js}`, {
      cwd: absMockPath,
    })
    .filter((item) => {
      if (!ignore) {
        return true
      }
      if (isFunction(ignore)) {
        return ignore(item)
      }
      if (isRegExp(ignore)) {
        return !ignore.test(path.basename(item))
      }
      return true
    })

  try {
    ret = []
    const resolveModulePromiseList = []

    for (let index = 0; index < mockFiles.length; index++) {
      const mockFile = mockFiles[index]
      resolveModulePromiseList.push(resolveModule(path.join(absMockPath, mockFile), config))
    }

    const loadAllResult = await Promise.all(resolveModulePromiseList)
    for (const resultModule of loadAllResult) {
      let mod = resultModule
      if (!isArray(mod)) {
        mod = [mod]
      }
      ret = [...ret, ...mod]
    }
  } catch (error: any) {
    loggerOutput(`mock reload error`, error)
    ret = []
  }
  return ret
}

// Inspired by vite
// support mock .ts files
async function resolveModule(p: string, config: ResolvedConfig): Promise<any> {
  const mockData = await bundleRequire({
    filepath: p,
  })

  let mod = mockData.mod.default || mockData.mod
  if (isFunction(mod)) {
    mod = await mod({ env: config.env, mode: config.mode, command: config.command })
  }
  return mod
}

// get custom config file path and mock dir path
function getPath(opt: ViteMockOptions) {
  const { mockPath, configPath } = opt
  const cwd = process.cwd()
  const absMockPath = isAbsPath(mockPath) ? mockPath! : path.join(cwd, mockPath || '')
  const absConfigPath = path.join(cwd, configPath || '')
  return {
    absMockPath,
    absConfigPath,
  }
}

function loggerOutput(title: string, msg: string, type: 'info' | 'error' = 'info') {
  const tag = type === 'info' ? colors.cyan(`[vite:mock]`) : colors.red(`[vite:mock-server]`)
  return console.log(
    `${colors.dim(new Date().toLocaleTimeString())} ${tag} ${colors.green(title)} ${colors.dim(
      msg,
    )}`,
  )
}
