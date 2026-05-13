import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.scss';

/**
 * MSW Mock 서버 활성화 조건:
 *   1. 개발 모드 (import.meta.env.DEV === true)
 *   2. VITE_USE_MOCK 환경변수가 'true'
 *
 * 프로덕션 빌드에서는 조건 1이 항상 false이므로
 * VITE_USE_MOCK 값에 관계없이 MSW가 절대 로드되지 않는다.
 *
 * 사용법:
 *   Mock API 사용  → VITE_USE_MOCK=true  npm run dev   (또는 .env.development 에 설정)
 *   실제 API 사용  → VITE_USE_MOCK=false npm run dev
 */
async function enableMocking() {
  const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

  if (!useMock) return;

  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
