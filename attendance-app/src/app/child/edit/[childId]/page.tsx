"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import Image from "next/image";
import Loading from "@/components/Loading";

type DecodedToken = {
  userId: string;
  role: "superAdmin" | "admin" | "child";
};

type Child = {
  id: string;
  name: string;
  birthDay: string;
  photoPath: string;
  gender: "male" | "female";
  phone: string | null;
  lineId: string | null;
  cacaoTalkId: string | null;
  assignedAdminId: string | null;
};

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams<{ childId: string }>();
  const childId = params?.childId;
  const [isLoading, setIsLoading] = useState(true);
  const [child, setChild] = useState<Child | null>(null);
  const [form, setForm] = useState({
    name: "",
    birthDay: null as Date | null,
    photoPath: "",
    gender: "" as "male" | "female" | "",
    phone: "",
    lineId: "",
    cacaoTalkId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({
    name: false,
    birthDay: false,
    gender: false,
  });

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
      jwtDecode<DecodedToken>(token);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!childId) {
      setMessage("無効な学生IDです。");
      return;
    }
    fetch(`/api/child/${childId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          return;
        }
        setChild(data);
        setForm({
          name: data.name,
          birthDay: data.birthDay ? new Date(data.birthDay) : null,
          photoPath: data.photoPath,
          gender: data.gender,
          phone: data.phone || "",
          lineId: data.lineId || "",
          cacaoTalkId: data.cacaoTalkId || "",
        });
        setPreview(data.photoPath);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching child:", error);
        setMessage("学生情報の取得中にエラーが発生しました。");
      });
  }, [childId]);

  const getToken = () => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
        setMessage("JPEGまたはPNG形式のみの画像を選択してください。");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newErrors = {
      name: !form.name,
      birthDay: !form.birthDay,
      gender: !form.gender,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setMessage("必須項目を入力してください。");
      setIsLoading(false);
      return;
    }

    let newPhotoPath = form.photoPath;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/child/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.photoPath) {
        newPhotoPath = uploadData.photoPath;
      } else {
        setIsLoading(false);
        setMessage("画像アップロードに失敗しました。");
        return;
      }
    }

    try {
      const res = await fetch("/api/child/edit", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          childId,
          name: form.name,
          birthDay: form.birthDay?.toISOString().split("T")[0],
          photoPath: newPhotoPath,
          gender: form.gender,
          phone: form.phone || null,
          lineId: form.lineId || null,
          cacaoTalkId: form.cacaoTalkId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("修正完了!");
        setIsLoading(false);
        router.push("/dashboard");
      } else {
        setMessage(data.message || "修正失敗");
      }
    } catch (error) {
      console.error("Error editing child:", error);
      setMessage("修正中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    if (!window.confirm("この学生の情報を削除しますか?")) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/child/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ childId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("削除完了!");
        setIsLoading(false);
        router.push("/dashboard");
      } else {
        setMessage(data.message || "削除失敗");
      }
    } catch (error) {
      console.error("Error deleting child:", error);
      setMessage("削除中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!child && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <p className="text-red-600 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading />}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg transform transition-all hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          学生情報修正
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-md animate-fade-in ${
              message.includes("完了")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            aria-live="polite"
            id="form-message"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-describedby="form-message">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              名前<span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              required
              aria-invalid={errors.name}
              aria-describedby="name-error form-message"
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
              selected={form.birthDay}
              onChange={(date: Date | null) =>
                setForm({ ...form, birthDay: date })
              }
              dateFormat="yyyy-MM-dd"
              placeholderText="生年月日を選択してください"
              locale={ko}
              maxDate={new Date()}
              minDate={new Date(2000, 0, 1)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.birthDay ? "border-red-500" : "border-gray-300"
              }`}
              required
              aria-invalid={errors.birthDay}
              aria-describedby="birthDay-error form-message"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              写真
            </label>
            {preview && (
              <Image
                width={80}
                height={80}
                src={preview}
                alt="写真プレビュー"
                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 mb-4"
              />
            )}
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-semibold hover:file:bg-blue-600 transition-all duration-300"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              性別<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === "male"}
                  onChange={() => setForm({ ...form, gender: "male" })}
                  className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300"
                  required
                />
                <span className="ml-2 text-gray-600">男性</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === "female"}
                  onChange={() => setForm({ ...form, gender: "female" })}
                  className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300"
                  required
                />
                <span className="ml-2 text-gray-600">女性</span>
              </label>
            </div>
            {errors.gender && (
              <p
                className="text-red-500 text-sm mt-1"
                id="gender-error"
                aria-live="polite"
              >
                性別を選択してください
              </p>
            )}
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
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
              type="text"
              value={form.lineId}
              onChange={(e) => setForm({ ...form, lineId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="cacaoTalkId"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              KakaoTalk ID
            </label>
            <input
              id="cacaoTalkId"
              type="text"
              value={form.cacaoTalkId}
              onChange={(e) =>
                setForm({ ...form, cacaoTalkId: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="保存ボタン"
            >
              {isLoading ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
              aria-label="キャンセルボタン"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="削除ボタン"
            >
              {isLoading ? "削除中..." : "削除"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
