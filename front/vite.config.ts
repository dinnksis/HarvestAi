
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'sonner@2.0.3': 'sonner',
        'react-hook-form@7.55.0': 'react-hook-form',
        'figma:asset/41f23ca405025acc44aa205f51b861eea6248e9e.png': path.resolve(__dirname, './src/assets/41f23ca405025acc44aa205f51b861eea6248e9e.png'),
        'figma:asset/16679cb0b4116d921018915aff6402138e19535a.png': path.resolve(__dirname, './src/assets/16679cb0b4116d921018915aff6402138e19535a.png'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });