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
  photo?: File | null; // 새 필드: 사진 파일
}

interface ErrorsState {
  name: boolean;
  email: boolean;
  password: boolean;
  role: boolean;
  birthDay: boolean;
  gender: boolean;
  emailFormat: boolean;
  photo?: boolean; // 새 필드: 사진 에러
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    birthDay: "",
    gender: "",
    photo: null, // 초기값 설정
  });
  const [errors, setErrors] = useState<ErrorsState>({
    name: false,
    email: false,
    password: false,
    role: false,
    birthDay: false,
    gender: false,
    emailFormat: false,
    photo: false, // 초기값 설정
  });
  const [submitError, setSubmitError] = useState<string>("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // 사진 미리보기
  const router = useRouter();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 사진 파일 변경 핸들러
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setForm({ ...form, photo: file || null });

    // 미리보기 업데이트
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      setPhotoPreview(null);
    }

    setErrors({ ...errors, photo: false });
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

    // 컴포넌트 언마운트 시 미리보기 URL 해제
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [router, photoPreview]);

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
    console.log("Form data:", form); // 디버깅 로그
    const newErrors: ErrorsState = {
      name: !form.name,
      email: !form.email,
      password: !form.password,
      birthDay: !form.birthDay,
      gender: !form.gender,
      role: !form.role,
      emailFormat: form.email ? !isValidEmail(form.email) : false,
      photo: false, // 사진은 필수 아님
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setSubmitError(
        newErrors.emailFormat
          ? "정확한 이메일 주소를 입력해주세요."
          : "모든 필수 항목을 입력해주세요."
      );
      return;
    }

    setSubmitError("");
    setIsLoading(true);

    // FormData로 데이터 전송
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("role", form.role);
    formData.append("birthDay", form.birthDay);
    formData.append("gender", form.gender);
    if (form.photo) {
      formData.append("photo", form.photo); // 사진 추가
    }

    try {
      console.log("form.name:", form.name); // 디버깅 로그
      console.log("FormData:", formData); // 디버깅 로그
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData, // FormData 전송
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setSubmitError(data.message || "선생님 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("등록 에러:", error);
      setSubmitError("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading message="데이터를 로드 중입니다..." />}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transform transition-all hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          선생님 추가
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
              이름<span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="이름을 입력해주세요"
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
              이메일<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.email || errors.emailFormat
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="이메일 주소를 입력해주세요"
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
                이메일 주소 형식이 올바르지 않습니다.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              비밀번호<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="비밀번호를 입력해주세요"
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
              생년월일<span className="text-red-500">*</span>
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
              placeholderText="생년월일을 선택해주세요"
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
              성별<span className="text-red-500">*</span>
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
                성별을 선택해주세요
              </option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              역할<span className="text-red-500">*</span>
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
              <option value="admin">관리자</option>
              {role === "master" && (
                <option value="superAdmin">슈퍼 관리자</option>
              )}
            </select>
          </div>

          {/* 새 필드: 사진 업로드 */}
          <div>
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              프로필 사진
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.photo ? "border-red-500" : "border-gray-300"
              }`}
              onChange={handlePhotoChange}
              aria-describedby="form-message"
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="프로필 사진 미리보기"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="선생님 추가"
            >
              {isLoading ? "추가 중..." : "선생님 추가"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
              aria-label="취소"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
