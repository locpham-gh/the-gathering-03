import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import { apiFetch } from "../../lib/api";

export function EventsManager({ user }: { user: any }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/events");
        if (res.success) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
          Lịch Họp Của Bạn
        </h3>
        <button 
          onClick={() => navigate('/schedule/new')}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-sm"
        >
          <Calendar size={16} /> Lên lịch mới
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Bơm dữ liệu từ hệ thống...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
           <p className="text-slate-400">Bạn chưa có lịch họp hoặc sự kiện nào sắp diễn ra.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((evt) => {
            const startDate = new Date(evt.startTime);
            const endDate = new Date(evt.endTime);
            const isHost = evt.hostId?._id === user.id;

            return (
              <div key={evt._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group">
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
                  <span className="text-xs font-bold text-red-500 uppercase">{startDate.toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-2xl font-black text-slate-800">{startDate.getDate()}</span>
                </div>
                
                <div className="flex-[2]">
                  <h4 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    {evt.title}
                    {isHost && <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Host</span>}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="font-mono text-xs">{evt.roomId?.code || 'Virtual Room'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Khách mời</span>
                    <span className="text-sm font-medium text-slate-700">{evt.guestEmails?.length || 0} Emails</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/room/${evt.roomId?.code}`)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95 text-sm whitespace-nowrap"
                  >
                    Vào phòng
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
