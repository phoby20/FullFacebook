"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loading from "@/components/Loading";

interface FormState {
  name: string;
  birthDay: string;
  gender: string;
  phone: string;
  lineId: string;
  cacaoTalkId: string;
  photo: File | null;
}

interface ErrorsState {
  name: boolean;
  birthDay: boolean;
  gender: boolean;
}

export default function AddChildPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    birthDay: "",
    gender: "",
    phone: "",
    lineId: "",
    cacaoTalkId: "",
    photo: null,
  });
  const [errors, setErrors] = useState<ErrorsState>({
    name: false,
    birthDay: false,
    gender: false,
  });
  const [submitError, setSubmitError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.userId);
      } else {
        alert("ログインが必要です");
        router.push("/login");
      }
    };

    fetchUser();
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (form.photo) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(form.photo);
    } else {
      setPhotoPreview(null);
    }
  }, [form.photo]);

  const handleInputChange = (
    field: keyof Omit<FormState, "photo">,
    value: string
  ) => {
    setForm({ ...form, [field]: value });
    if (field === "name" || field === "birthDay" || field === "gender") {
      setErrors({ ...errors, [field]: !value });
    }
  };

  const handleFileChange = (file: File | null) => {
    setForm({ ...form, photo: file });
  };

  const handleSubmit = async () => {
    if (!userId) {
      setSubmitError("先生のIDが必要です");
      return;
    }

    const newErrors: ErrorsState = {
      name: !form.name,
      birthDay: !form.birthDay,
      gender: !form.gender,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setSubmitError("名前、誕生日、性別は必須です");
      return;
    }

    setSubmitError("");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("birthDay", form.birthDay);
    formData.append("gender", form.gender);
    formData.append("managerId", userId);
    if (form.phone) formData.append("phone", form.phone);
    if (form.lineId) formData.append("lineId", form.lineId);
    if (form.cacaoTalkId) formData.append("cacaoTalkId", form.cacaoTalkId);
    if (form.photo) formData.append("photo", form.photo);

    try {
      const res = await fetch("/api/child/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("登録が完了しました");
        router.push("/dashboard");
      } else {
        setSubmitError(data.message || "登録に失敗しました");
      }
    } catch (err) {
      setSubmitError(`サーバーエラーが発生しました (${err})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading />}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transform transition-all hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          学生登録
        </h1>

        {submitError && (
          <div
            className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md animate-fade-in"
            aria-live="polite"
            id="form-error"
          >
            {submitError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          aria-describedby="form-error"
        >
          <div className="mb-6">
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
              aria-describedby="name-error form-error"
            />
          </div>

          <div className="mb-6">
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
              required
              aria-invalid={errors.birthDay}
              aria-describedby="birthDay-error form-error"
            />
          </div>

          <div className="mb-6">
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
              aria-describedby="gender-error form-error"
            >
              <option value="" disabled>
                性別を選択してください
              </option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              電話番号
            </label>
            <input
              id="phone"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="電話番号を入力してください"
              value={form.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="lineId"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Line ID
            </label>
            <input
              id="lineId"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Line IDを入力してください"
              value={form.lineId}
              onChange={(e) => handleInputChange("lineId", e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="cacaoTalkId"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              CacaoTalk ID
            </label>
            <input
              id="cacaoTalkId"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="CacaoTalk IDを入力してください"
              value={form.cacaoTalkId}
              onChange={(e) => handleInputChange("cacaoTalkId", e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              写真 (オプション)
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-semibold hover:file:bg-blue-600 transition-all duration-300"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            {photoPreview && (
              <div className="mt-4">
                <img
                  src={photoPreview}
                  alt="写真プレビュー"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="登録ボタン"
          >
            {isLoading ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </div>
  );
}
