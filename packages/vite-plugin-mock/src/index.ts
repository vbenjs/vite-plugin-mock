;(async () => {
  try {
    await import('mockjs')
  } catch (e) {
    throw new Error('vite-plugin-vue-mock requires mockjs to be present in the dependency tree.')
  }
})()

import type { ViteMockOptions } from './types'
import type { Plugin } from 'vite'
import { ResolvedConfig } from 'vite'
import { createMockServer, requestMiddleware } from './createMockServer'

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

    configureServer: async ({ middlewares }) => {
      const { enable = isDev } = opt
      if (!enable) {
        return
      }
      const middleware = await requestMiddleware(opt)
      middlewares.use(middleware)
    },
  }
}

export * from './types'
