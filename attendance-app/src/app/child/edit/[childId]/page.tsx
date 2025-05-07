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
      jwtDecode<DecodedToken>(token); // 토큰 검증
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
      if (selectedFile.size > 1024 * 1024) {
        setMessage("파일 크기는 1MB 이하여야 합니다.");
        return;
      }
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
    setIsLoading(true);
    e.preventDefault();
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
  };

  const handleDelete = async () => {
    setIsLoading(true);
    if (!window.confirm("この学生の情報を削除しますか?")) {
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
        setIsLoading(false);
        setMessage(data.message || "削除失敗");
      }
    } catch (error) {
      console.error("Error deleting child:", error);
      setIsLoading(false);
      setMessage("削除中にエラーが発生しました。");
    }
  };

  if (!child && message) {
    return (
      <div className="p-6">
        <p className="text-red-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {isLoading && <Loading />}
      <h1 className="text-xl font-bold mb-4">学生情報修正</h1>
      {message && (
        <div
          className={`mb-4 ${
            message.includes("완료") ? "text-green-600" : "text-red-500"
          }`}
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            名前<span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`border p-2 w-full ${
              errors.name ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            required
          />
        </div>

        <div>
          <label
            htmlFor="birthDay"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
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
            placeholderText="생년월일을 선택하세요"
            locale={ko}
            maxDate={new Date()}
            minDate={new Date(2000, 0, 1)}
            className={`border p-2 w-full ${
              errors.birthDay ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            required
          />
        </div>

        <div>
          <label
            htmlFor="photo"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            写真
          </label>
          {preview && (
            <Image
              width={500}
              height={500}
              src={preview}
              alt="미리보기"
              className="w-20 h-20 object-cover rounded mb-2"
            />
          )}
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border p-2 w-full border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-[10px]">
            性別<span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={form.gender === "male"}
                onChange={() => setForm({ ...form, gender: "male" })}
                className="mr-2"
                required
              />
              男性
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={form.gender === "female"}
                onChange={() => setForm({ ...form, gender: "female" })}
                className="mr-2"
                required
              />
              女性
            </label>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">性別を選択してください</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            電話番号
          </label>
          <input
            id="phone"
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="lineId"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            Line ID
          </label>
          <input
            id="lineId"
            type="text"
            value={form.lineId}
            onChange={(e) => setForm({ ...form, lineId: e.target.value })}
            className="border p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="cacaoTalkId"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            KakaoTalk ID
          </label>
          <input
            id="cacaoTalkId"
            type="text"
            value={form.cacaoTalkId}
            onChange={(e) => setForm({ ...form, cacaoTalkId: e.target.value })}
            className="border p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </form>
    </div>
  );
}
