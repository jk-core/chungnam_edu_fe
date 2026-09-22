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
    port: 13009,
    /*
      개발 중에는 BE 를 같은 출처처럼 보이게 한다 — 브라우저가 다른 출처로 나가면 CORS 와
      쿠키 규칙이 배포판과 달라져, 여기서만 되거나 여기서만 안 되는 일이 생긴다.
      주소는 VITE_APP_API_PATH 로 덮어쓸 수 있다.
    */
    proxy: {
      '/api': {
        target: process.env.VITE_APP_API_PATH ?? 'http://192.168.2.110:13000',
        changeOrigin: true,
      },
    },
  },
});
