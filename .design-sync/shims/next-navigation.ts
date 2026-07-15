// Shim next/navigation cho design-sync bundle — hook điều hướng thành no-op
// để component render được ngoài Next runtime (preview/design agent).
export function useRouter() {
  return {
    push: (_url?: string) => {},
    replace: (_url?: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: (_url?: string) => {},
  };
}

export function usePathname(): string {
  return "/";
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useParams(): Record<string, string> {
  return {};
}

export function redirect(_url: string): void {}
export function notFound(): void {}
