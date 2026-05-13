/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** MSW Mock 서버 사용 여부 ('true' | 'false') */
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
