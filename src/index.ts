import { createMockServerPlugin } from './mockServerPlugin';
import { CreateMock } from './types';
import { Plugin } from 'vite';

export function createMockServer(opt: CreateMock): Plugin {
  // Turn on only when needed
  const { localEnabled = process.env.NODE_ENV === 'development' } = opt;
  if (!localEnabled) {
    return {};
  }
  return {
    configureServer: createMockServerPlugin(opt),
  };
}

export * from './types';
