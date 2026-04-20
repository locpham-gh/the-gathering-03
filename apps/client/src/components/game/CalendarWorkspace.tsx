import { CalendarClock } from "lucide-react";

export function CalendarWorkspace() {
  return (
    <div className="h-full w-full p-6 md:p-8 overflow-y-auto bg-slate-100">
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <CalendarClock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Calendar</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lich su kien trong phong. Ban co the mo nhanh Event booking tai day.
            </p>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Today</p>
            <p className="text-xs text-slate-500 mt-1">No event in this room.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Upcoming</p>
            <p className="text-xs text-slate-500 mt-1">
              Sap toi: dong bo voi lich event manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
