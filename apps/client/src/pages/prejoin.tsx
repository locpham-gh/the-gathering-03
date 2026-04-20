import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";
import {
  CHARACTER_2D,
  resolveAvatarUrl,
  sanitizeCharacter2D,
} from "../lib/profile";
import { loadPrejoinSettings, savePrejoinSettings } from "../lib/prejoin";

type DeviceOption = {
  deviceId: string;
  label: string;
};

export default function PrejoinPage() {
  const { user, updateUser } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initialSettings = useMemo(() => loadPrejoinSettings(), []);
  const [name, setName] = useState(
    initialSettings.lastDisplayName || user?.displayName || "",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialSettings.lastAvatarUrl || user?.avatarUrl || "",
  );
  const [character2d, setCharacter2d] = useState(
    sanitizeCharacter2D(initialSettings.lastCharacter2d || user?.character2d),
  );
  const [micEnabled, setMicEnabled] = useState(initialSettings.micEnabled);
  const [cameraEnabled, setCameraEnabled] = useState(initialSettings.cameraEnabled);
  const [micDevices, setMicDevices] = useState<DeviceOption[]>([]);
  const [cameraDevices, setCameraDevices] = useState<DeviceOption[]>([]);
  const [selectedMicId, setSelectedMicId] = useState(initialSettings.preferredMicId || "");
  const [selectedCameraId, setSelectedCameraId] = useState(
    initialSettings.preferredCameraId || "",
  );
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const setupDevices = async () => {
      try {
        setLoadingDevices(true);
        setError(null);
        const tempStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        tempStream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;

        const mics = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, idx) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${idx + 1}` }));
        const cameras = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, idx) => ({ deviceId: d.deviceId, label: d.label || `Camera ${idx + 1}` }));

        setMicDevices(mics);
        setCameraDevices(cameras);

        if (!selectedMicId && mics[0]) setSelectedMicId(mics[0].deviceId);
        if (!selectedCameraId && cameras[0]) setSelectedCameraId(cameras[0].deviceId);
      } catch {
        if (!cancelled) setError("Không thể truy cập mic/camera. Hãy kiểm tra quyền trình duyệt.");
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    };

    setupDevices();
    return () => {
      cancelled = true;
    };
  }, [selectedMicId, selectedCameraId]);

  useEffect(() => {
    let cancelled = false;
    const startPreview = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (!micEnabled && !cameraEnabled) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micEnabled
            ? selectedMicId
              ? { deviceId: { exact: selectedMicId } }
              : true
            : false,
          video: cameraEnabled
            ? selectedCameraId
              ? { deviceId: { exact: selectedCameraId } }
              : true
            : false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setError("Không khởi tạo được camera/mic preview.");
      }
    };

    startPreview();
    return () => {
      cancelled = true;
    };
  }, [micEnabled, cameraEnabled, selectedMicId, selectedCameraId]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleContinue = async () => {
    if (!user || !roomId) return;
    if (!name.trim()) {
      setError("Tên hiển thị không được để trống.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const normalizedAvatar = resolveAvatarUrl(avatarUrl, user.gender);
      const payload = {
        displayName: name.trim(),
        avatarUrl: normalizedAvatar,
        gender: user.gender || "other",
        character2d,
      };

      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res?.success && res.user) {
        updateUser(res.user);
      } else {
        updateUser({ ...user, ...payload });
      }

      savePrejoinSettings({
        preferredMicId: selectedMicId || undefined,
        preferredCameraId: selectedCameraId || undefined,
        micEnabled,
        cameraEnabled,
        lastDisplayName: name.trim(),
        lastAvatarUrl: normalizedAvatar,
        lastCharacter2d: character2d,
      });

      navigate(`/room/${roomId}/play`);
    } catch (err: any) {
      setError(err?.message || "Không thể lưu cấu hình trước khi vào phòng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Room Check</h1>
            <p className="text-sm text-slate-500">
              Kiểm tra mic/camera, tên, avatar và nhân vật 2D trước khi vào phòng.
            </p>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            Quay lại
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-0">
          <div className="p-8 border-r border-slate-100">
            <div className="rounded-2xl bg-slate-900 h-[340px] overflow-hidden flex items-center justify-center relative">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-200 text-center">
                  <VideoOff className="mx-auto mb-3" />
                  Camera đang tắt
                </div>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setMicEnabled((v) => !v)}
                  className={`p-3 rounded-full ${micEnabled ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-100"}`}
                >
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  onClick={() => setCameraEnabled((v) => !v)}
                  className={`p-3 rounded-full ${cameraEnabled ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-100"}`}
                >
                  {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="font-semibold text-slate-600">Microphone</span>
                <select
                  disabled={loadingDevices || micDevices.length === 0}
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 bg-white"
                >
                  {micDevices.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="font-semibold text-slate-600">Camera</span>
                <select
                  disabled={loadingDevices || cameraDevices.length === 0}
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 bg-white"
                >
                  {cameraDevices.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-600">Tên hiển thị</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2"
                placeholder={user ? resolveAvatarUrl(user.avatarUrl, user.gender) : ""}
              />
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={resolveAvatarUrl(avatarUrl, user?.gender)}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <span className="text-xs text-slate-500">Preview avatar</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Nhân vật 2D</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {CHARACTER_2D.map((character) => {
                  const active = character2d === character;
                  return (
                    <button
                      key={character}
                      onClick={() => setCharacter2d(character)}
                      className={`rounded-xl border p-2 ${active ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}
                    >
                      <img
                        src={`/assets/Characters_free/${character}_idle_16x16.png`}
                        className="w-10 h-10 mx-auto"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <p className="text-[11px] mt-1">{character}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>
            )}

            <button
              onClick={handleContinue}
              disabled={saving || !roomId}
              className="w-full rounded-xl px-4 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Đang chuẩn bị..." : "Vào phòng ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
