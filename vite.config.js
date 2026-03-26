import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stadium: resolve(__dirname, 'stadium-guide.html'),
        ticket: resolve(__dirname, 'ticket-guide.html'),
        schedule: resolve(__dirname, 'schedule-summary.html'),
        faq: resolve(__dirname, 'faq.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
});
