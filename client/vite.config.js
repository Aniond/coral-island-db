import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy: /api/* -> Express backend (server runs on :3001).
// Harmless before the backend exists; ready for when it does.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
