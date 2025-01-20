import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/__mocks__/skeletonProxy.ts']
  }
});
