import { api, ApiError } from "./api";

declare global {
  interface Window {
    google?: any;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;
let isPrompting = false;

export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export async function promptGoogleAuth(options: {
  onSuccess: (data: { role: string; needsOnboarding: boolean }) => void;
  onError: (errorMsg: string) => void;
}) {
  if (isPrompting) return;
  isPrompting = true;

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    isPrompting = false;
    options.onError("Google Client ID chưa được cấu hình ở frontend.");
    return;
  }

  try {
    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      isPrompting = false;
      options.onError("Không thể tải Google Identity SDK.");
      return;
    }

    // Cancel any active prompt before initializing new prompt
    try {
      window.google.accounts.id.cancel();
    } catch {
      // Ignore if no active prompt
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      use_fedcm_for_prompt: false, // Prevents conflicting/duplicate FedCM browser prompt aborts
      callback: async (response: { credential?: string }) => {
        isPrompting = false;
        if (!response.credential) {
          options.onError("Google không trả về ID Token.");
          return;
        }

        try {
          // Gửi idToken về backend NestJS POST /auth/google
          const res = await api<{
            user: any;
            tokens: { accessToken: string; refreshToken: string };
          }>("/auth/google", {
            method: "POST",
            body: { idToken: response.credential },
          });

          localStorage.setItem("accessToken", res.tokens.accessToken);
          localStorage.setItem("refreshToken", res.tokens.refreshToken);

          // Kiểm tra thông tin người dùng
          const me = await api<{ languages: unknown[]; role: string }>("/users/me", {
            token: res.tokens.accessToken,
          });

          options.onSuccess({
            role: me.role,
            needsOnboarding: me.languages.length === 0,
          });
        } catch (err) {
          if (err instanceof ApiError) {
            options.onError(err.message);
          } else {
            options.onError("Đăng nhập Google thất bại. Vui lòng thử lại.");
          }
        }
      },
    });

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.();
        console.warn("Google One Tap not displayed:", reason);
        if (reason === "unregistered_origin") {
          isPrompting = false;
          options.onError(
            "Domain 'http://localhost:3000' chưa được thêm vào Authorized JavaScript origins trên Google Cloud Console."
          );
        } else if (reason !== "suppressed_by_user") {
          triggerGoogleFallbackPopup(options);
        } else {
          isPrompting = false;
        }
      }
    });
  } catch (err) {
    isPrompting = false;
    options.onError("Lỗi khi kết nối tới dịch vụ Google.");
  }
}

function triggerGoogleFallbackPopup(options: {
  onSuccess: (data: { role: string; needsOnboarding: boolean }) => void;
  onError: (errorMsg: string) => void;
}) {
  let container = document.getElementById("google-hidden-btn-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "google-hidden-btn-container";
    container.style.display = "none";
    document.body.appendChild(container);
  }
  container.innerHTML = "";

  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
  });

  setTimeout(() => {
    const btn = container?.querySelector("div[role=button]") as HTMLElement | null;
    if (btn) {
      btn.click();
    } else {
      isPrompting = false;
      options.onError("Không thể kích hoạt cửa sổ đăng nhập Google.");
    }
  }, 100);
}
