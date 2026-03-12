"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasToken = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("token="));

    if (hasToken) setIsLoggedIn(true);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[75vh] min-h-[460px]">
        <Image
          src="/welcome.jpg"
          alt="Welcome"
          fill
          priority
          className="object-cover"
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Centered Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white text-4xl sm:text-6xl font-semibold tracking-tight drop-shadow-lg">
            純福音東京教会
          </h1>

          <h2 className="text-white text-lg sm:text-2xl mt-4 drop-shadow-md">
            中高等部 出席管理システム
          </h2>

          {/* Login Button */}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white/95 backdrop-blur px-8 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-gray-700 text-sm leading-relaxed text-center shadow-sm">
          <p className="mb-3 font-medium text-gray-900 text-base">ようこそ！</p>

          <p>
            このシステムは <strong>純福音東京教会 中高等部</strong> の
            出席管理のための Webアプリケーションです。
          </p>

          <p className="mt-4">
            ログイン後、左上の{" "}
            <span className="font-medium">「クラス設定」</span>
            から先生と学生を登録してください。
          </p>
        </div>
      </div>
    </main>
  );
}
