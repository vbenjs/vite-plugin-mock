import { MockMethod } from 'vite-plugin-mock';
export default [
  {
    url: '/api/createUser',
    method: 'post',
    response: ({ body }) => {
      console.log('body>>>>>>>>', body);
      return {
        code: 0,
        message: 'ok',
        data: null,
      };
    },
  },
] as MockMethod[];
