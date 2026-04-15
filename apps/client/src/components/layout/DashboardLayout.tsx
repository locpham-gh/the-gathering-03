import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Home, 
  Layout, 
  Settings, 
  LogOut, 
  PlusCircle,
  ChevronRight,
  Calendar,
  MessageCircle
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Overview", path: "/home", icon: <Home size={20} /> },
    { name: "My Rooms", path: "/home/rooms", icon: <Layout size={20} /> },
    { name: "My Events", path: "/home/events", icon: <Calendar size={20} /> },
    { name: "Community", path: "/home/forum", icon: <MessageCircle size={20} /> },
    { name: "Profile", path: "/home/profile", icon: <Settings size={20} /> },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">The Gathering</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-primary/10 text-primary font-bold shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
             <div className="flex items-center gap-3">
                <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-white shadow-sm" />
                <div className="overflow-hidden">
                   <p className="text-sm font-bold truncate">{user.displayName}</p>
                   <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10">
           <h2 className="text-lg font-bold text-slate-700">
             {menuItems.find(i => i.path === location.pathname)?.name || "Dashboard"}
           </h2>
           <button 
             onClick={() => navigate("/home")}
             className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
           >
             <PlusCircle size={18} />
             <span>Create Room</span>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
           {/* Background Decorations */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none -z-10"></div>
           
           <div className="relative z-0 max-w-5xl mx-auto">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
};
