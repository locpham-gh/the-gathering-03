import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/game');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full"></div>
      <div className="text-center z-10 glass p-12 rounded-[2.5rem] border-primary/20 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Successful</h2>
        <p className="text-slate-400 text-sm">Entering the metaverse...</p>
        <div className="w-12 h-1 border-t-2 border-primary animate-pulse mx-auto mt-8"></div>
      </div>
    </div>
  );
}
