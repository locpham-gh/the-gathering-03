import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number | string }>;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value.toLocaleString()}</h3>
      </div>
    </div>
  );
};
