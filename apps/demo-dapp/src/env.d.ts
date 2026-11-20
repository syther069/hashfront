interface ImportMetaEnv {
  readonly VITE_SPENDER?: string;
  readonly VITE_AMOUNT?: string;
  readonly VITE_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
