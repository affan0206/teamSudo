import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createAcademicInsightRbacPlugin } from './server/authAndDataServer.mjs';

export default defineConfig({
  plugins: [react(), createAcademicInsightRbacPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
