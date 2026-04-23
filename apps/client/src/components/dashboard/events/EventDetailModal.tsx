import { useNavigate } from "react-router-dom";
import { Clock, MapPin, X, ExternalLink, Trash2, Mail, CalendarDays } from "lucide-react";
import type { EventItem } from "./types";
import { formatDate, formatTime, getDuration, isUpcoming } from "./utils";

interface EventDetailModalProps {
  event: EventItem;
  userId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function EventDetailModal({
  event,
  userId,
  onClose,
  onDelete,
}: EventDetailModalProps) {
  const navigate = useNavigate();
  const isHost = event.hostId?._id === userId;
  const upcoming = isUpcoming(event.startTime);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color bar top */}
        <div className={`h-2 w-full ${upcoming ? "bg-teal-500" : "bg-slate-300"}`} />

        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                {isHost && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Bạn là host
                  </span>
                )}
                {!upcoming && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Đã kết thúc
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {event.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-teal-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">
                  {formatDate(event.startTime)}
                </p>
                <p className="text-slate-500">
                  {formatTime(event.startTime)} — {formatTime(event.endTime)}
                  <span className="ml-2 text-slate-400">
                    ({getDuration(event.startTime, event.endTime)})
                  </span>
                </p>
              </div>
            </div>

            {/* Room */}
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-teal-500 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">
                  {event.roomId?.name || "Virtual Room"}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {event.roomId?.code}
                </p>
              </div>
            </div>

            {/* Host */}
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-teal-100 border-2 border-teal-500" />
              </div>
              <div className="flex items-center gap-2">
                {event.hostId?.avatarUrl && (
                  <img
                    src={event.hostId.avatarUrl}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                    alt=""
                  />
                )}
                <span className="text-slate-700 font-medium">
                  {event.hostId?.displayName || "Host"}
                </span>
                <span className="text-slate-400">(Chủ tọa)</span>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="flex items-start gap-3">
                <CalendarDays size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-slate-600 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Guests */}
            {event.guestEmails?.length > 0 && (
              <div className="mt-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Khách mời ({event.guestEmails.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.guestEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {upcoming && event.roomId?.code && (
              <button
                onClick={() => navigate(`/room/${event.roomId.code}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <ExternalLink size={16} /> Vào phòng họp
              </button>
            )}
            {isHost && (
              <button
                onClick={() => onDelete(event._id)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
