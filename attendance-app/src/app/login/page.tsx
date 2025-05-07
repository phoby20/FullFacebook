// app/login/page.tsx
"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      document.cookie = `token=${data.token}`;
      window.location.href = "/dashboard";
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">ログイン</h1>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 mb-2 w-full"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2"
      >
        ログイン
      </button>
    </div>
  );
}
