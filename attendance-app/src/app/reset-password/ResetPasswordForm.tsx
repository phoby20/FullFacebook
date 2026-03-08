"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setMessage("無効なリセットリンクです。");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessage("すべての項目を入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("パスワードが一致しません。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "エラーが発生しました。");
        setLoading(false);
        return;
      }

      setMessage("パスワードが変更されました。ログインしてください。");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage("サーバーエラーが発生しました。");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          パスワードリセット
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="新しいパスワード"
            className="w-full border p-3 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="パスワード確認"
            className="w-full border p-3 rounded-lg"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {message && (
            <p className="text-sm text-red-500 text-center">{message}</p>
          )}

          <button
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
          >
            {loading ? "処理中..." : "パスワードを変更"}
          </button>
        </form>
      </div>
    </div>
  );
}
