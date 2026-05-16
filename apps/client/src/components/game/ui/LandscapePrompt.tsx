import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

export const LandscapePrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      setIsMobile(isMobileDevice);
      
      // Checking portrait orientation
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    // Initial check
    checkOrientation();

    // Listen for resize and orientation change
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Only show the prompt on mobile devices that are currently in portrait mode
  if (!isMobile || !isPortrait) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center select-none">
      <div className="w-24 h-24 mb-8 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
        <Smartphone className="w-12 h-12 text-blue-400 rotate-90 transition-transform duration-1000" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Vui lòng xoay ngang thiết bị</h1>
      <p className="text-slate-300 max-w-sm leading-relaxed mb-8">
        Không gian ảo được thiết kế để mang lại trải nghiệm tốt nhất ở chế độ xoay ngang. Hãy xoay điện thoại của bạn để có thể tham gia vào phòng nhé!
      </p>
      
      {/* Visual indicator of how to rotate */}
      <div className="flex items-center space-x-4 opacity-75">
        <div className="w-8 h-12 border-2 border-slate-400 rounded-sm relative">
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-400"></div>
        </div>
        <div className="w-8 h-0 border-t-2 border-dashed border-slate-500"></div>
        <div className="w-12 h-8 border-2 border-white rounded-sm relative shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    </div>
  );
};
