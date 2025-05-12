"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

type Gender = "male" | "female";
type Role = "master" | "superAdmin" | "admin" | "child";

interface User {
  id: string;
  name: string;
  email: string;
  birthDay: string;
  gender: Gender;
  photoPath?: string;
  phone?: string;
  lineId?: string;
  cacaoTalkId?: string;
  role: Role;
}

export default function UserEditPage() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!params) {
      setError("パラメータのロードに失敗しました");
      return;
    }

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data);
        setPreview(data.photoPath || null);
      } catch (error) {
        console.error("Fetch error:", error);
        setError("先生情報を取得できませんでした");
      }
    };

    fetchUser();
  }, [params]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!user) return;
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("data", JSON.stringify(user));
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: formData,
      });
      if (res.ok) {
        alert("先生情報が更新されました");
        window.dispatchEvent(new Event("userUpdated")); // Header, Dashboard 갱신
        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("更新中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <p className="p-4 bg-red-100 text-red-600 rounded-lg shadow-md animate-pulse">
          {error}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
            ></path>
          </svg>
          <span>loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          先生情報修正
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div className="relative">
            <input
              name="name"
              value={user.name}
              onChange={handleChange}
              placeholder="名前"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="名前"
              required
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              名前
            </label>
          </div>

          {/* 이메일 */}
          <div className="relative">
            <input
              name="email"
              type="email"
              value={user.email}
              onChange={handleChange}
              placeholder="email"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="email"
              required
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              email
            </label>
          </div>

          {/* 생년월일 */}
          <div className="relative">
            <input
              type="date"
              name="birthDay"
              value={user.birthDay.slice(0, 10)}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="生年月日"
              required
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              生年月日
            </label>
          </div>

          {/* 성별 */}
          <div className="relative">
            <select
              name="gender"
              value={user.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 appearance-none bg-white"
              aria-label="性別"
              required
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200">
              性別
            </label>
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>

          {/* 전화번호 */}
          <div className="relative">
            <input
              name="phone"
              value={user.phone ?? ""}
              onChange={handleChange}
              placeholder="電話番号"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="電話番号"
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              電話番号
            </label>
          </div>

          {/* LINE ID */}
          <div className="relative">
            <input
              name="lineId"
              value={user.lineId ?? ""}
              onChange={handleChange}
              placeholder="LINE ID"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="LINE ID"
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              LINE ID
            </label>
          </div>

          {/* 카카오톡 ID */}
          <div className="relative">
            <input
              name="cacaoTalkId"
              value={user.cacaoTalkId ?? ""}
              onChange={handleChange}
              placeholder="카카오톡 ID"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 peer"
              aria-label="카카오톡 ID"
            />
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200 peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400">
              Cacaotalk ID
            </label>
          </div>

          {/* 역할 */}
          <div className="relative">
            <select
              name="role"
              value={user.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 appearance-none bg-white"
              aria-label="役割"
            >
              {user.role === "superAdmin" && (
                <option value="superAdmin">슈퍼 관리자</option>
              )}
              <option value="admin">先生</option>
            </select>
            <label className="absolute left-3 -top-2 text-sm text-gray-500 bg-white px-1 transition-all duration-200">
              役割
            </label>
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>

          {/* 프로필 이미지 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              プロフィール画像
            </label>
            {preview && (
              <div className="relative w-32 h-32">
                <Image
                  src={preview}
                  alt="프로필 미리보기"
                  fill
                  className="object-cover rounded-full border-2 border-gray-200"
                  sizes="128px"
                />
              </div>
            )}
            <label className="inline-block cursor-pointer bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all duration-200">
              画像選択
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="画像選択"
              />
            </label>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 flex justify-center items-center ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="保存"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                  ></path>
                </svg>
              ) : null}
              {isSubmitting ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-300"
              aria-label="キャンセル"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
