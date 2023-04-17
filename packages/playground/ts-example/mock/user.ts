import type { MockConfig } from 'vite-plugin-mock'

export default (config?: MockConfig) => {
  return [
    {
      url: '/api/createUser',
      method: 'post',
      response: ({ body, query }) => {
        console.log('body>>>>>>>>', body)
        console.log('query>>>>>>>>', query)

        return {
          code: 0,
          message: 'ok',
          data: { a: 21, 'import.meta.url': import.meta.url },
        }
      },
    },
  ]
}
