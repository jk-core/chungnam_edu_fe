import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Provider from '@/layouts/Provider';
import { applyTheme, getTheme } from '@/stores/themeStore';
import App from './App';
import './index.scss';

// 첫 페인트 전에 저장된 테마를 반영해 색이 튀지 않게 한다.
applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
);
