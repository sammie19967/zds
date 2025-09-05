import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'pdfmake']
  },
  build: {
    commonjsOptions: {
      include: [/jspdf/, /jspdf-autotable/, /pdfmake/, /node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: ['fs'],
      output: {
        manualChunks: {
          pdfmake: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']
        }
      }
    }
  }
});
