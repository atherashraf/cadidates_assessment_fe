/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_MAP_URL?: string;
  readonly VITE_APP_PORT?: string;
  readonly VITE_MAP_PORT?: string;
  readonly VITE_MAP_ENDPOINT?: string;
  readonly VITE_DEFAULT_MAP_EXTENT?: string;
  readonly VITE_MAP_EXTENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}