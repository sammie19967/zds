import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { htmlPrerender } from 'vite-plugin-html-prerender';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    htmlPrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/about-us',
        '/contact-us',
        '/our-team',
        '/courses',
        '/enroll',
        '/computing',
        '/driving',
        '/admission-form',
        '/fees-structure'
      ],
      selector: '#root',
      minify: {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        keepClosingSlash: true,
        sortAttributes: true
      }
    })
  ],
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
