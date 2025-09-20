import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? { junit: 'logs/vitest-junit.xml' } : undefined,
    coverage: {
      enabled: false
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
});
