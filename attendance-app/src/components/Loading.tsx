// src/components/Loading.tsx
"use client";

import { FC } from "react";

interface LoadingProps {
  message?: string; // 로딩 메시지 (선택)
}

const Loading: FC<LoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        {/* 로딩 스피너 */}
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        {/* 로딩 메시지 */}
        {message && (
          <p className="text-white text-lg font-semibold drop-shadow-md">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
