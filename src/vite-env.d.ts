/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCOGS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
