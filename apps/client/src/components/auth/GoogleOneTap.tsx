import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback?: (response: { credential: string }) => void;
            ux_mode?: "popup" | "redirect";
            login_uri?: string;
          }) => void;
          renderButton: (element: HTMLElement, options: unknown) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  showPrompt?: boolean;
}

let isGoogleInitialized = false;

export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({
  showPrompt = true,
}) => {
  const { user, login } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  useEffect(() => {
    // Intercept console.error to detect Google's popup blocker warning
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("Failed to open popup window")
      ) {
        setIsPopupBlocked(true);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    if (user) return; // Skip if already authenticated

    const startAuth = () => {
      if (!window.google) return;

      // 1. Initialize only ONCE globally
      if (!isGoogleInitialized) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
          ux_mode: "redirect",
          login_uri: `${apiUrl}/api/auth/google`,
        });
        isGoogleInitialized = true;
      }

      // 2. Render Button and Prompt EVERY TIME the component mounts
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
        });
      }

      if (showPrompt) {
        window.google.accounts.id.prompt();
      }
    };

    if (window.google) {
      startAuth();
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (script) {
        script.addEventListener("load", startAuth);
      }
    }
  }, [login, showPrompt, user]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={btnRef} className="flex justify-center min-h-[40px]"></div>
      {isPopupBlocked && (
        <div className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 max-w-sm text-center animate-in zoom-in duration-300">
          ⚠️ Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng tắt{" "}
          <b>AdGuard / Adblock</b> hoặc cho phép <b>Popup</b> để tiếp tục!
        </div>
      )}
    </div>
  );
};
