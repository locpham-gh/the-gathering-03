import React, { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleOneTap: React.FC = () => {
  const { login } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for google script to load if it hasn't
    const initGoogleAuth = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
        callback: async (response: any) => {
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

      if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
              theme: "outline",
              size: "large",
              shape: "pill",
          });
      }

      window.google.accounts.id.prompt();
    };

    if (window.google) {
      initGoogleAuth();
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener("load", initGoogleAuth);
      }
    }
  }, [login]);

  return <div ref={btnRef} className="w-full flex justify-center mt-4 min-h-[40px]"></div>;
};
