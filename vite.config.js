import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'supabase', test: /node_modules\/@supabase\// }] },
      },
    },
  },
  server: { host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
});
