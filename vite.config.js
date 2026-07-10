import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@mui')) return 'vendor-mui';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('redux')) {
            return 'vendor-react';
          }
          if (id.includes('jspdf') || id.includes('xlsx') || id.includes('papaparse')) return 'vendor-docs';
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
