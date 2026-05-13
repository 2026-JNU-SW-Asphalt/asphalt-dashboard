/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** MSW Mock 서버 사용 여부 ('true' | 'false') */
  readonly VITE_USE_MOCK: string;
  /** 카카오맵 JavaScript API 키 */
  readonly VITE_KAKAO_MAP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
