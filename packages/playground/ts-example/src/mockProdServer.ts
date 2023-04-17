import { createProdMockServer } from 'vite-plugin-mock/client'
import roleMock from '../mock/dep/role'
import userMockFn from '../mock/user'

export async function setupProdMockServer() {
  const mockModules = [...roleMock, ...userMockFn()]
  createProdMockServer(mockModules)
}
