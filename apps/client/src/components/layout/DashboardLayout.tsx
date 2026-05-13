import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { 
  Home, 
  Layout, 
  Settings, 
  LogOut, 
  PlusCircle,
  ChevronRight,
  Calendar,
  MessageCircle,
  Shield,
  Menu,
  X
} from "lucide-react";
import { NotificationCenter } from "../dashboard/NotificationCenter";
import { QuickCreateRoomModal } from "../dashboard/rooms/QuickCreateRoomModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, fullWidth }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "Overview", path: "/home", icon: <Home size={20} /> },
    { name: "My Rooms", path: "/home/rooms", icon: <Layout size={20} /> },
    { name: "My Events", path: "/home/events", icon: <Calendar size={20} /> },
    { name: "Community", path: "/home/forum", icon: <MessageCircle size={20} /> },
    { name: "Profile", path: "/home/profile", icon: <Settings size={20} /> },
  ];

  if (user?.role === "admin") {
    menuItems.push({ name: "Admin Panel", path: "/admin", icon: <Shield size={20} /> });
  }

  const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  if (!user) return null;

  // Đóng sidebar trên mobile khi chuyển trang
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <QuickCreateRoomModal 
        isOpen={isQuickCreateOpen} 
        onClose={() => setIsQuickCreateOpen(false)} 
        userDisplayName={user.displayName}
      />

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-40 shadow-xl transition-transform duration-300 ease-in-out
        md:relative md:w-64 md:translate-x-0 md:shadow-sm
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div>
              <span className="text-xl font-bold tracking-tight text-slate-800">The Gathering</span>
            </div>
            <button 
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={20} />
            </button>
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
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
             <div className="flex items-center gap-3">
                <img 
                  src={user.avatarUrl} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-white shadow-sm object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/8.x/notionists/svg?seed=${user.displayName}`}}
                />
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
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
           <div className="flex items-center gap-3">
             <button 
               className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
               onClick={() => setIsMobileSidebarOpen(true)}
             >
               <Menu size={24} />
             </button>
             <h2 className="text-lg font-bold text-slate-700 hidden sm:block">
               {menuItems.find(i => i.path === location.pathname)?.name || "Dashboard"}
             </h2>
           </div>
           <div className="flex items-center gap-4">
             <NotificationCenter user={{ 
               id: user.id, 
               displayName: user.displayName, 
               avatarUrl: user.avatarUrl || "" 
             }} />
             <button 
               onClick={() => setIsQuickCreateOpen(true)}
               className="bg-primary text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-sm"
             >
               <PlusCircle size={18} />
               <span className="hidden sm:inline">Create Room</span>
             </button>
           </div>
        </header>

        <div className={`flex-1 relative ${fullWidth ? "overflow-hidden" : "overflow-y-auto p-4 md:p-8"}`}>
           {/* Background Decorations */}
           {!fullWidth && <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none -z-10"></div>}
           
           <div className={`relative z-0 ${fullWidth ? "w-full h-full" : "max-w-5xl mx-auto"}`}>
              {children}
           </div>
        </div>
      </main>
    </div>
  );
};
