"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
  exp: number;
  iat: number;
};

// form과 errors 객체의 타입 정의
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
  emailFormat: boolean; // 이메일 형식 오류 추가
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
  const router = useRouter();

  // 이메일 형식 검증 정규식
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) return router.push("/login");

    try {
      const decoded: DecodedToken = jwtDecode(token);
      setRole(decoded.role);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm({ ...form, [field]: value });

    // 이메일 필드의 경우 형식도 검증
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

  const handleRegister = async () => {
    // 모든 필드 유효성 검사
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

    // 하나라도 오류가 있으면 제출 중단
    if (Object.values(newErrors).some((error) => error)) {
      setSubmitError(
        newErrors.emailFormat
          ? "올바른 이메일 형식을 입력해주세요."
          : "모든 필수 항목을 입력해주세요."
      );
      return;
    }

    setSubmitError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) router.push("/dashboard");
    else setSubmitError(data.message || "先生追加に失敗しました");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">先生追加</h1>
      {submitError && (
        <p className="text-red-500 mb-4" aria-live="polite">
          {submitError}
        </p>
      )}

      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          名前<span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          className={`border p-2 w-full ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="名前を入力してください"
          value={form.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          Email<span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          className={`border p-2 w-full ${
            errors.email || errors.emailFormat
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Emailを入力してください"
          type="email"
          value={form.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
        />
        {errors.emailFormat && (
          <p className="text-red-500 text-sm mt-1">
            email形式が正しくありません。
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          パスワード<span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          className={`border p-2 w-full ${
            errors.password ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="パスワードを入力してください"
          value={form.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="birthDay"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
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
          className={`border p-2 w-full ${
            errors.birthDay ? "border-red-500" : "border-gray-300"
          }`}
          dateFormat="yyyy-MM-dd"
          maxDate={new Date()}
          placeholderText="生年月日を入力してください"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          性別<span className="text-red-500">*</span>
        </label>
        <select
          id="gender"
          className={`border p-2 w-full ${
            errors.gender ? "border-red-500" : "border-gray-300"
          }`}
          value={form.gender}
          onChange={(e) => handleInputChange("gender", e.target.value)}
          required
        >
          <option value="" disabled>
            性別を選択してください
          </option>
          <option value="male">男性</option>
          <option value="female">女性</option>
        </select>
      </div>

      <div className="mb-4">
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          役割<span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          className={`border p-2 w-full ${
            errors.role ? "border-red-500" : "border-gray-300"
          }`}
          value={form.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
          required
        >
          <option value="admin">Admin</option>
          {role === "master" && <option value="superAdmin">SuperAdmin</option>}
        </select>
      </div>

      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2"
      >
        先生追加
      </button>
    </div>
  );
}
