import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number | string }>;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-200/60 shadow-2xl shadow-slate-200/40 flex flex-col gap-6 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:bg-white overflow-hidden">
      {/* Decorative background element */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`} />
      
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200/50 transform transition-transform duration-500 group-hover:rotate-12`}>
            <Icon size={28} />
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Status</span>
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
            </div>
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Units</span>
        </div>
      </div>

      {/* Mini Progress Bar Visual */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} w-3/4 rounded-full opacity-80 group-hover:w-full transition-all duration-1000 ease-out`} />
      </div>
    </div>
  );
};
