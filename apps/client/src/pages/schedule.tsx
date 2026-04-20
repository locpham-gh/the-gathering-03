import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { eventsApi } from "../lib/api";
import { resolveAvatarUrl } from "../lib/profile";
import { 
  X, Clock, AlignLeft, 
  MapPin, Bell, Users, Plus, Save
} from "lucide-react";

export default function ScheduleEventPage() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("Sự kiện Meta mới");
  const [description, setDescription] = useState("");
  // Determine standard times relative to current moment
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30); // Round up to next 30 min
  
  const end = new Date(now);
  end.setHours(end.getHours() + 1);

  // HTML datetime-local requires YYYY-MM-DDThh:mm format
  const toLocalISO = (d: Date) => {
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(toLocalISO(now));
  const [endTime, setEndTime] = useState(toLocalISO(end));
  
  const [guestEmail, setGuestEmail] = useState("");
  const [guests, setGuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addGuest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (guestEmail && guestEmail.includes("@") && !guests.includes(guestEmail)) {
      setGuests([...guests, guestEmail]);
      setGuestEmail("");
    }
  };

  const removeGuest = (emailToRemove: string) => {
    setGuests(guests.filter(e => e !== emailToRemove));
  };

  const handleSave = async () => {
    if (!user || !roomId) return;
    setLoading(true);
    try {
      const payload = {
        roomId,
        hostId: user.id,
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        guestEmails: guests
      };

      await eventsApi.scheduleMeeting(payload);
      alert("✅ Lên lịch và gửi Email thành công!");
      navigate("/home");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert("Lỗi khi tạo lịch: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 flex justify-center overflow-auto">
      <div className="w-full max-w-5xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col my-auto border border-slate-200 overflow-hidden min-h-[85vh]">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <button 
            onClick={() => navigate("/home")}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded-md font-medium transition shadow-sm disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            <span>Lưu</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1">
          
          {/* Main Left Pane - Event Details */}
          <div className="flex-1 p-6 md:p-10 md:pr-6 border-r border-slate-100">
            {/* Title Input */}
            <div className="mb-8 pl-12 relative">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Thêm tiêu đề"
                className="w-full text-3xl md:text-4xl outline-none border-b-2 border-transparent focus:border-[#1a73e8] pb-2 transition-colors placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-6">
              {/* Date / Time */}
              <div className="flex items-start gap-4">
                <div className="pt-3 w-8 flex justify-center text-slate-500">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <input 
                      type="datetime-local" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-sm font-medium p-2 bg-slate-50 hover:bg-slate-100 rounded outline-none border border-transparent focus:border-slate-300"
                    />
                    <span className="text-slate-500 text-sm">tới</span>
                    <input 
                      type="datetime-local" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-sm font-medium p-2 bg-slate-50 hover:bg-slate-100 rounded outline-none border border-transparent focus:border-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#1a73e8] focus:ring-[#1a73e8]" id="allday" />
                    <label htmlFor="allday" className="cursor-pointer">Cả ngày</label>
                    <div className="ml-4 px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer text-sm font-medium">
                      Không lặp lại
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 border-t ml-12" />

              {/* Location (Metaverse Virtual Room) */}
              <div className="flex items-start gap-4">
                <div className="pt-2 w-8 flex justify-center text-slate-500">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-[#e8f0fe] hover:bg-[#d2e3fc] cursor-pointer text-[#1967d2] p-3 rounded-md font-medium text-sm transition-colors mb-2">
                    Tham gia bằng The Gathering Metaverse (Video)
                    <div className="text-xs font-normal opacity-80 mt-1">
                      Tối đa 100 kết nối với khách • Hỗ trợ Breakout Rooms 2D
                    </div>
                  </div>
                  <input 
                    type="text" 
                    disabled
                    value={roomId === "new" ? "Một phòng ảo sẽ được tự động khởi tạo." : `Room ID: ${roomId}`}
                    className="w-full bg-slate-50 text-slate-500 p-2 text-sm rounded outline-none border border-transparent italic"
                  />
                </div>
              </div>

              {/* Notification Placeholder */}
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center text-slate-500">
                  <Bell size={20} />
                </div>
                <div className="flex gap-2 items-center text-sm">
                  <select className="p-2 outline-none hover:bg-slate-50 rounded cursor-pointer border border-transparent focus:border-slate-200">
                    <option>Thông báo</option>
                    <option>Email</option>
                  </select>
                  <input type="number" defaultValue={30} className="w-16 p-2 text-center outline-none hover:bg-slate-50 rounded border border-transparent focus:border-slate-200" />
                  <select className="p-2 outline-none hover:bg-slate-50 rounded cursor-pointer border border-transparent focus:border-slate-200">
                    <option>phút</option>
                    <option>tiếng</option>
                  </select>
                  <X size={16} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                </div>
              </div>

              <hr className="border-slate-100 border-t ml-12" />

              {/* Description */}
              <div className="flex items-start gap-4">
                <div className="pt-2 w-8 flex justify-center text-slate-500">
                  <AlignLeft size={20} />
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-[#1a73e8] overflow-hidden transition-colors">
                  <div className="p-2 bg-white border-b border-slate-200 flex items-center gap-1">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-600 font-serif font-bold w-7">B</button>
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-600 font-serif italic w-7">I</button>
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-600 underline w-7">U</button>
                  </div>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Thêm nội dung mô tả hoặc liên kết tài liệu..."
                    className="w-full h-40 p-4 outline-none bg-transparent resize-y text-sm"
                  ></textarea>
                </div>
              </div>
              
            </div>
          </div>

          {/* Right Pane - Guests */}
          <div className="w-full md:w-80 bg-white p-6 md:p-8 flex flex-col border-t md:border-t-0 border-slate-100">
            <div className="flex items-center gap-3 text-[#1a73e8] font-medium border-b border-[#1a73e8] pb-3 mb-6 mix-blend-multiply">
              <Users size={20} />
              <span>Khách</span>
            </div>

            {/* Guest Input */}
            <form onSubmit={addGuest} className="relative mb-6">
              <input 
                type="text" 
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Thêm khách qua email"
                className="w-full p-3 bg-slate-100 hover:bg-slate-200 focus:bg-white text-sm rounded-md outline-none border-b-2 border-transparent focus:border-[#1a73e8] transition-colors pr-10"
              />
              {guestEmail && (
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full">
                  <Plus size={16} />
                </button>
              )}
            </form>

            {/* Guest List */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="text-sm font-bold text-slate-600 mb-3 flex items-center justify-between">
                <span>Danh sách ({guests.length})</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveAvatarUrl(user.avatarUrl, user.gender)}
                    alt=""
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                  <div className="flex-1 text-sm">
                    <span className="font-semibold block truncate leading-tight text-slate-800">{user.displayName}</span>
                    <span className="text-xs text-slate-500">Chủ tọa</span>
                  </div>
                </div>
                
                {guests.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fce8e6] text-[#d93025] flex items-center justify-center font-bold text-sm shrink-0 border border-transparent">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-sm overflow-hidden">
                      <span className="block truncate leading-tight text-slate-600">{email}</span>
                    </div>
                    <button 
                      onClick={() => removeGuest(email)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Guest Permissions mock */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Quyền của khách</div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#1a73e8]" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800">Sửa đổi sự kiện</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#1a73e8]" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800">Mời những người khác</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#1a73e8]" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800">Xem danh sách khách mời</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
