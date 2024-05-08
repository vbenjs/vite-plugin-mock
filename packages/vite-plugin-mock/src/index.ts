;(async () => {
  try {
    await import('mockjs')
  } catch (e) {
    throw new Error('vite-plugin-vue-mock requires mockjs to be present in the dependency tree.')
  }
})()

import colors from 'picocolors'
import type { ViteMockOptions } from './types'
import sirv from 'sirv'
import type { Plugin } from 'vite'
import { ResolvedConfig } from 'vite'
import {
  createMockServer,
  excludeMock,
  mockData,
  parseJson,
  requestMiddleware,
} from './createMockServer'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'node:url'

const DIR_CLIENT = resolve(
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url)),
  '../dist/inspect',
)

export function viteMockServe(opt: ViteMockOptions = {}): Plugin {
  let isDev = false
  let config: ResolvedConfig

  return {
    name: 'vite:mock',
    enforce: 'pre' as const,
    configResolved(resolvedConfig) {
      config = resolvedConfig
      isDev = config.command === 'serve'
      isDev && createMockServer(opt, config)
    },

    configureServer: async (server) => {
      const { middlewares } = server

      const { enable = isDev } = opt
      if (!enable) {
        return
      }
      const middleware = await requestMiddleware(opt)
      middlewares.use(middleware)

      /**
       * get mock list
       */
      middlewares.use('/__mockInspect/list', (req, res, next) => {
        res.end(
          JSON.stringify(
            mockData.map((i) => {
              return {
                ...i,
                exclude: excludeMock.has(`${i.url}+${i.method || 'get'}`),
              }
            }),
          ),
        )
      })

      /**
       * set exclude url
       */
      middlewares.use('/__mockInspect/exclude', (req, res, next) => {
        const isPost = req.method && req.method.toUpperCase() === 'POST'
        if (isPost) {
          parseJson(req).then((body: any) => {
            if (body && body.urlList) {
              excludeMock.clear()
              ;(body.urlList as string[]).forEach((url) => {
                excludeMock.add(url)
              })
              res.end(JSON.stringify({ code: 0 }))
            } else {
              next()
            }
          })
        } else {
          next()
        }
      })

      /**
       * serve inspect page
       */
      middlewares.use(
        '/__mockInspect',
        sirv(DIR_CLIENT, {
          single: true,
          dev: true,
        }),
      )

      const host =
        config.server.host && config.server.host !== '0.0.0.0' ? config.server.host : 'localhost'
      const source = `${host}:${config.server.port || 5173}`

      const _printUrls = server.printUrls.bind(server)

      server.printUrls = () => {
        _printUrls()
        console.log(
          `  ${colors.green('➜')}  ${colors.bold('Mock Inspect: ')}` +
            colors.green(`${config.server.https ? 'https' : 'http'}://${source}/#/__mockInspect`),
        )
      }
    },
  }
}

export * from './types'
