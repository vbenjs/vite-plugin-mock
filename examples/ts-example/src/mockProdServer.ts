import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer';
import roleMock from '../mock/role';
import userMock from '../mock/user';

export const mockModules = [...roleMock, ...userMock];

export function setupProdMockServer() {
  createProdMockServer(mockModules);
}
