import { Bot } from "lucide-react";

export function AIWorkspace() {
  return (
    <div className="h-full w-full p-6 md:p-8 overflow-y-auto bg-slate-100">
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gather A.I</h2>
            <p className="text-sm text-slate-500 mt-1">
              Trang tro ly AI trong phong. Co the mo rong de tom tat chat va goi y hanh dong.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-700">AI assistant placeholder</p>
          <p className="text-xs text-slate-500 mt-1">
            Coming integration: room context, summaries, action suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}
