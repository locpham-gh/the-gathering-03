import { CalendarDays, Hourglass, Plus } from "lucide-react";

interface EmptyStateProps {
  tab: "upcoming" | "past";
  onSchedule: () => void;
}

export function EventsEmptyState({ tab, onSchedule }: EmptyStateProps) {
  return (
    <div className="py-24 text-center flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
        {tab === "upcoming" ? (
          <CalendarDays size={36} />
        ) : (
          <Hourglass size={36} />
        )}
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-800">
          {tab === "upcoming"
            ? "Chưa có sự kiện nào sắp tới"
            : "Chưa có sự kiện nào đã qua"}
        </h4>
        <p className="text-slate-500 mt-1">
          {tab === "upcoming"
            ? "Tạo sự kiện mới để mời đồng nghiệp tham gia The Gathering."
            : "Lịch sử cuộc họp của bạn sẽ xuất hiện ở đây."}
        </p>
      </div>
      {tab === "upcoming" && (
        <button
          onClick={onSchedule}
          className="mt-4 bg-white border-2 border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:border-teal-500 hover:text-teal-600 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Tự tạo lịch mới
        </button>
      )}
    </div>
  );
}
