import { useEffect } from "react";
import {
  ArrowRight,
  Users,
  Map,
  Video,
  Library,
  Sparkles,
  MessageSquare,
  MonitorPlay,
  Zap,
} from "lucide-react";
import { GoogleOneTap } from "../components/auth/GoogleOneTap";
import { EmailOTPForm } from "../components/auth/EmailOTPForm";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            G
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            The Gathering
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Community
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Resources
          </a>
        </div>
        <div className="z-20">
          {!user && <GoogleOneTap showPrompt={false} />}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-6xl font-extrabold leading-tight text-slate-900">
            Virtual <span className="text-primary italic">workspace</span> for
            civilized teams.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-[500px]">
            Enhance focus and connection with your colleagues in a minimalist,
            friendly 2D metaverse.
          </p>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 max-w-md w-full relative z-20">
            {/* 1. Email OTP Form */}
            <EmailOTPForm />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                OR CONTINUE WITH
              </span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            {/* 2. Google Login */}
            <div className="flex justify-center w-full">
              {!user ? (
                <div className="w-full flex justify-center py-2 relative z-50">
                  <GoogleOneTap showPrompt={false} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 15}`}
                    alt="user"
                  />
                </div>
              ))}
            </div>
            <span>+50 people online right now</span>
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in duration-1000">
          <div className="bg-slate-100 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
              className="rounded-[2rem] shadow-sm w-full h-[450px] object-cover"
              alt="Workspace preview"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Users size={24} />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900 border-none">
                  24 Events
                </p>
                <p className="text-slate-500 text-sm">Happening this week</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Logos Section */}
      {/* <section className="border-y border-slate-100 bg-slate-50/50 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center animate-in fade-in duration-1000 delay-300 fill-mode-both">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Trusted by innovative automated teams
          </p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 grayscale opacity-40">
            <h3 className="text-2xl font-black font-serif">Acme Corp</h3>
            <h3 className="text-2xl font-black tracking-tighter">GlobalTech</h3>
            <h3 className="text-2xl font-bold uppercase italic">Nexus</h3>
            <h3 className="text-2xl font-black font-mono">Quantum</h3>
            <h3 className="text-2xl font-bold">Horizon</h3>
          </div>
        </div>
      </section> */}

      {/* Bento Grid Features */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Built for the remote era
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Everything you need to collaborate, focus, and socialize in a
              single spatial environment without the meeting fatigue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-50 rounded-[2rem] p-8 md:p-12 border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              <Video className="text-teal-600 mb-6 w-12 h-12" />
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Proximity Voice & Video
              </h3>
              <p className="text-slate-600 max-w-md text-lg leading-relaxed">
                Walk up to a colleague to start talking. Walk away to leave the
                conversation. Spatial audio mimics real life perfectly,
                eliminating rigid scheduled calls.
              </p>
            </div>
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:shadow-xl transition-shadow">
              <Map className="text-sky-500 mb-6 w-12 h-12" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Custom Maps
              </h3>
              <p className="text-slate-600 text-lg">
                Build your exact office layout using our Tiled Map engine. Make
                it feel like your real home.
              </p>
            </div>
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:shadow-xl transition-shadow">
              <Library className="text-indigo-500 mb-6 w-12 h-12" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Focus Zones
              </h3>
              <p className="text-slate-600 text-lg">
                Enter the Library or private pods to mute outside noise and
                signal deep work status.
              </p>
            </div>
            <div className="md:col-span-2 bg-slate-50 rounded-[2rem] p-8 md:p-12 border border-slate-100 overflow-hidden relative hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <MonitorPlay className="text-rose-500 mb-6 w-12 h-12" />
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    Seamless Screen Sharing
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Present your work instantly to anyone in your immediate
                    vicinity without sending Google Meet links.
                  </p>
                </div>
                <div className="flex-1 right-0 bg-white p-4 rounded-2xl shadow-xl rotate-3 border border-slate-100 flex items-center justify-center">
                  <div className="w-full h-40 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <span className="text-slate-400 font-medium">
                      Screen Share Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Z-Layout */}
      <section className="py-24 bg-slate-900 text-white relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-teal-400 text-sm font-semibold mb-6 border border-white/10">
                <Sparkles size={16} /> The Interactive Metaverse
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your digital office shouldn't feel like a spreadsheet.
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed">
                Break out of the endless grid of video calls. Walk around, bump
                into teammates, and have serendipitous watercooler moments that
                spark innovation.
              </p>
            </div>
            <div className="bg-slate-800 rounded-3xl p-4 border border-slate-700 shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1000"
                className="rounded-2xl w-full opacity-80 mix-blend-luminosity"
                alt="Tech office"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="bg-slate-800 rounded-3xl p-4 border border-slate-700 shadow-2xl -skew-y-2 hover:skew-y-0 transition-transform duration-500 md:order-1 order-2">
              <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center flex-col gap-4 border border-slate-800">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                    <Users className="text-teal-400" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                    <MessageSquare className="text-sky-400" />
                  </div>
                </div>
                <span className="text-slate-500 font-mono text-sm mt-4 uppercase tracking-widest">
                  LiveKit WebRTC Core
                </span>
              </div>
            </div>
            <div className="md:order-2 order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sky-400 text-sm font-semibold mb-6 border border-white/10">
                <Zap size={16} /> Enterprise Performance
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Global low-latency voice and video network.
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed">
                Powered by LiveKit and WebSockets, enjoy ultra-low latency
                spatial audio that scales to hundreds of concurrent users in the
                same room without breaking a sweat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 relative z-10 text-center bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-8 tracking-tight">
            Ready to bring your team together?
          </h2>
          <p className="text-xl text-slate-500 mb-12 leading-relaxed">
            Join hundreds of forward-thinking teams already building their
            headquarters in The Gathering.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-teal-600 hover:-translate-y-1 transition-all duration-300 shadow-xl flex items-center gap-3 group"
            >
              Start your virtual office{" "}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-8 py-12 text-slate-400 text-sm flex justify-between items-center relative z-10">
        <p>© 2026 The Gathering. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}
