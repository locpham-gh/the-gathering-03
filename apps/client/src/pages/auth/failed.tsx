import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="absolute inset-0 bg-red-500/5 blur-[100px] rounded-full"></div>
      <div className="text-center z-10 glass p-12 rounded-[2.5rem] border-red-500/20 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20 font-bold text-3xl">
          ❌
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Failed</h2>
        <p className="text-slate-400 text-sm">Please try again later...</p>
        <button 
           onClick={() => navigate('/')} 
           className="mt-8 text-primary text-xs uppercase tracking-widest font-bold hover:underline"
        >
          Return to home
        </button>
      </div>
    </div>
  );
}
