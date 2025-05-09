"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jwtDecode } from "jwt-decode";
import Loading from "@/components/Loading";
import { ko } from "date-fns/locale";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
  exp: number;
  iat: number;
};

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  birthDay: string;
  gender: string;
}

interface ErrorsState {
  name: boolean;
  email: boolean;
  password: boolean;
  role: boolean;
  birthDay: boolean;
  gender: boolean;
  emailFormat: boolean;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    birthDay: "",
    gender: "",
  });
  const [errors, setErrors] = useState<ErrorsState>({
    name: false,
    email: false,
    password: false,
    role: false,
    birthDay: false,
    gender: false,
    emailFormat: false,
  });
  const [submitError, setSubmitError] = useState<string>("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      setRole(decoded.role);
      setIsLoading(false);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm({ ...form, [field]: value });

    if (field === "email") {
      setErrors({
        ...errors,
        email: !value,
        emailFormat: value ? !isValidEmail(value) : false,
      });
    } else {
      setErrors({ ...errors, [field]: !value });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ErrorsState = {
      name: !form.name,
      email: !form.email,
      password: !form.password,
      birthDay: !form.birthDay,
      gender: !form.gender,
      role: !form.role,
      emailFormat: form.email ? !isValidEmail(form.email) : false,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setSubmitError(
        newErrors.emailFormat
          ? "正しいメールアドレスを入力してください。"
          : "すべての必須項目を入力してください。"
      );
      return;
    }

    setSubmitError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setSubmitError(data.message || "先生の追加に失敗しました");
      }
    } catch (error) {
      setSubmitError(`登録中にエラーが発生しました ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading message="データを読み込んでいます..." />}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transform transition-all hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          先生の追加
        </h1>

        {submitError && (
          <div
            className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md animate-fade-in"
            aria-live="polite"
            id="form-message"
          >
            {submitError}
          </div>
        )}

        <form
          onSubmit={handleRegister}
          aria-describedby="form-message"
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              名前<span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="名前を入力してください"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              aria-invalid={errors.name}
              aria-describedby="form-message"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Email<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.email || errors.emailFormat
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="メールアドレスを入力してください"
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              aria-invalid={errors.email || errors.emailFormat}
              aria-describedby="email-error form-message"
            />
            {errors.emailFormat && (
              <p
                className="text-red-500 text-sm mt-1"
                id="email-error"
                aria-live="polite"
              >
                メールアドレスの形式が正しくありません。
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              パスワード<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="パスワードを入力してください"
              value={form.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              aria-invalid={errors.password}
              aria-describedby="form-message"
            />
          </div>

          <div>
            <label
              htmlFor="birthDay"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              生年月日<span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="birthDay"
              selected={form.birthDay ? new Date(form.birthDay) : null}
              onChange={(date: Date | null) =>
                handleInputChange(
                  "birthDay",
                  date ? date.toISOString().split("T")[0] : ""
                )
              }
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.birthDay ? "border-red-500" : "border-gray-300"
              }`}
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              placeholderText="生年月日を選択してください"
              locale={ko}
              required
              aria-invalid={errors.birthDay}
              aria-describedby="form-message"
            />
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              性別<span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              value={form.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              required
              aria-invalid={errors.gender}
              aria-describedby="form-message"
            >
              <option value="" disabled>
                性別を選択してください
              </option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              役割<span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
              value={form.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              required
              aria-invalid={errors.role}
              aria-describedby="form-message"
            >
              <option value="admin">管理者</option>
              {role === "master" && (
                <option value="superAdmin">スーパー管理者</option>
              )}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="先生を追加"
            >
              {isLoading ? "追加中..." : "先生を追加"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
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
