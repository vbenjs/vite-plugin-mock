import { createProdMockServer } from '../../../es/createProdMockServer'
import roleMock from '../mock/dep/role'
import userMock from '../mock/user'

export const mockModules = [...roleMock, ...userMock]

export function setupProdMockServer() {
  createProdMockServer(mockModules)
}
