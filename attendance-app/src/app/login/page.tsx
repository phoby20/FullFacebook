// app/login/page.tsx
"use client";
import { useState, FormEvent } from "react";
import Loading from "@/components/Loading";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼 기본 제출 방지
    console.log("handleLogin triggered"); // 디버깅 로그

    // 입력 유효성 검사
    if (!email || !password) {
      setError("Emailとパスワードを入力してください");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        document.cookie = `token=${data.token}; path=/`;
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "ログインに失敗しました");
        setIsLoading(false);
      }
    } catch (err) {
      setError(`サーバーエラーが発生しました。 (${err})`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {isLoading && <Loading />}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:scale-105">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
          FULLFACE
        </h1>

        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login
        </h3>

        {error && (
          <div
            className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
            id="form-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} aria-describedby="form-error">
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-1 transition-all duration-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Emailを入力してください"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              aria-describedby="email-error form-error"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-1 transition-all duration-300"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力してください"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              aria-describedby="password-error form-error"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="ログインボタン"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
