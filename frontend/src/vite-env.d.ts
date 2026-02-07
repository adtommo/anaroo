/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />


interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}