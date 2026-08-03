import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({ include: '**/*.svg' }),
    checker({
      typescript: true,
      overlay: {
        badgeStyle: 'width:fit-content;font-size:14px;',
      },
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  server: {
    host: true,
    // 사내 다른 프론트엔드가 3000번을 쓰고 있어 겹치지 않게 잡았다.
    port: 3100,
  },
});
