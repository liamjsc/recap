/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_EMBED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
