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

    const res = await fetch("/api/child/add", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert("登録が完了しました");
      router.push("/dashboard");
      setIsLoading(false);
    } else {
      setSubmitError(data.message || "登録に失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {isLoading && <Loading />}
      <h1 className="text-xl mb-4">学生登録</h1>
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
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          電話番号
        </label>
        <input
          id="phone"
          className="border p-2 w-full border-gray-300"
          placeholder="電話番号を入力してください"
          value={form.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="lineId"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          Line ID
        </label>
        <input
          id="lineId"
          className="border p-2 w-full border-gray-300"
          placeholder="Line IDを入力してください"
          value={form.lineId}
          onChange={(e) => handleInputChange("lineId", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="cacaoTalkId"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          CacaoTalk ID
        </label>
        <input
          id="cacaoTalkId"
          className="border p-2 w-full border-gray-300"
          placeholder="CacaoTalk IDを入力してください"
          value={form.cacaoTalkId}
          onChange={(e) => handleInputChange("cacaoTalkId", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="photo"
          className="block text-sm font-medium text-gray-700 mb-[10px]"
        >
          写真 (オプション)
        </label>
        <input
          id="photo"
          type="file"
          className="border p-2 w-full border-gray-300"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
      </div>

      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleSubmit}
      >
        登録
      </button>
    </div>
  );
}
