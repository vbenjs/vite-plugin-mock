import { createProdMockServer } from '../../../es/createProdMockServer'
import roleMock from '../mock/role'
import userMock from '../mock/user'

export function setupProdMockServer() {
  createProdMockServer([...roleMock, ...userMock])
}
