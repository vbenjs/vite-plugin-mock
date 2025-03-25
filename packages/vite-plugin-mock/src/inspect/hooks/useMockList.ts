import ky from 'ky'
import { ref } from 'vue'

export interface MockObj {
  url: string
  method: string
  exclude: boolean
  include: boolean
}

export function useMockList() {
  const mockList = ref([] as MockObj[])

  async function getList() {
    const data = (await ky('./list').json()) as MockObj[]

    mockList.value = data.map((i) => {
      return {
        ...i,
        include: !i.exclude,
      }
    })
    //sort by methos get-post-put-delete
    mockList.value.sort((a, b) => {
      const order = ['GET', 'POST', 'PUT', 'DELETE']
      return order.indexOf(a.method.toUpperCase()) - order.indexOf(b.method.toUpperCase())
    })
    // sort by url
    mockList.value.sort((a, b) => {
      return a.url.localeCompare(b.url)
    })
  }

  getList()

  return {
    mockList,
    getList,
  }
}
