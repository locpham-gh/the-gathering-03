import React, { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";

declare global {
  interface Window {
    __gsiInitialized?: boolean;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
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

export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({ showPrompt = true }) => {
  const { user, login } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (user || isInitialized.current) return; // Skip if already authenticated or initialized

    // Wait for google script to load if it hasn't
    const initGoogleAuth = () => {
      if (!window.google || isInitialized.current) return;

      if (!window.__gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
          callback: async (response: { credential: string }) => {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
              const res = await fetch(`${apiUrl}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });

              const data = await res.json();
              if (data.success) {
                login(data.user, data.token);
              } else {
                console.error("Login failed:", data.error);
              }
            } catch (err) {
              console.error("API error", err);
            }
          },
        });
        window.__gsiInitialized = true;
      }
      isInitialized.current = true;

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
      initGoogleAuth();
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener("load", initGoogleAuth);
        return () => script.removeEventListener("load", initGoogleAuth);
      }
    }
  }, [login, showPrompt, user]);

  return <div ref={btnRef} className="flex justify-center min-h-[40px]"></div>;
};
