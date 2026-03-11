"use client";

import { useState } from "react";

type Student = {
  id: string;
  name: string;
  birthDay: string;
  photoPath: string;
};

type Props = {
  students: Student[];
  onClose: () => void;
};

export default function GraduationNoticeModal({ students, onClose }: Props) {
  const [hideWeek, setHideWeek] = useState<boolean>(false);

  const handleClose = () => {
    if (hideWeek) {
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const until = Date.now() + oneWeek;
      localStorage.setItem("hideGraduationNoticeUntil", String(until));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="w-[640px] max-w-[94vw] rounded-[28px] bg-white/90 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-white/40 overflow-hidden">
        {/* Header */}
        <div className="px-10 pt-8 pb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            卒業予定のお知らせ
          </h2>

          {/* Notice */}
          <div className="px-8 pt-2 text-center">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium px-5 py-2 shadow-sm">
              卒業を控えている学生がいます
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="px-8 pb-4 max-h-[340px] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-2xl bg-white/70 border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:bg-white transition-all"
              >
                <img
                  src={s.photoPath || "/default_user.png"}
                  alt={s.name}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />

                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-gray-900">
                    {s.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    生年月日 {new Date(s.birthDay).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-white/70 backdrop-blur">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hideWeek}
              onChange={(e) => setHideWeek(e.target.checked)}
              className="accent-gray-900"
            />
            一週間表示しない
          </label>

          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition shadow-sm cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
