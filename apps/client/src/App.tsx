import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/index";
import HomePage from "./pages/home";
import GamePage from "./pages/game";
import AdminPage from "./pages/AdminPage";
import AuthSuccess from "./pages/auth/success";
import AuthFailed from "./pages/auth/failed";

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const sessionHandledRef = useRef(false);

  useEffect(() => {
    const onSessionReplaced = (e: Event) => {
      if (sessionHandledRef.current) return;
      sessionHandledRef.current = true;
      const msg = (e as CustomEvent<{ message?: string }>).detail?.message;
      alert(msg || "Bạn bị đăng xuất vì đăng nhập ở thiết bị khác.");
      logout();
      window.location.replace("/");
    };
    window.addEventListener("session-replaced", onSessionReplaced);
    return () =>
      window.removeEventListener("session-replaced", onSessionReplaced);
  }, [logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/home" 
        element={user ? <HomePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/home/rooms" 
        element={user ? <HomePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/home/events" 
        element={user ? <HomePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/home/forum" 
        element={user ? <HomePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/home/profile" 
        element={user ? <HomePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/room/:roomId" 
        element={user ? <GamePage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/admin" 
        element={user ? <AdminPage /> : <Navigate to="/" replace />} 
      />
      <Route path="/auth/success" element={<AuthSuccess />} />
      <Route path="/auth/failed" element={<AuthFailed />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/home" : "/"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
