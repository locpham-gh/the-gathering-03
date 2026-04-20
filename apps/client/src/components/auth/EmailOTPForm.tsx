import React, { useState } from "react";
import { Mail, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export const EmailOTPForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập Email hợp lệ / Please enter a valid email");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("OTP");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Mã OTP phải gồm 6 chữ số / OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code: otp }),
      });
      if (res.success && res.token) {
        login(res.user, res.token);
        navigate("/home");
      } else {
        throw new Error(res.error || "Verification failed");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Mã OTP không chính xác / Invalid OTP";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-between">
          {error}
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {step === "EMAIL" ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70 shadow-lg shadow-slate-900/10"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Continue with Email"
            )}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleVerifyOTP}
          className="space-y-4 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-3">
              <KeyRound size={24} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Enter your code</h3>
            <p className="text-sm text-slate-500">
              We just sent a 6-digit code to <br />{" "}
              <strong className="text-slate-700">{email}</strong>
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-2xl py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900"
              disabled={loading}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Verify Identity"
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setStep("EMAIL");
                setOtp("");
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back to email
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
