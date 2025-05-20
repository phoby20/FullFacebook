// app/duty-settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Loading from "@/components/Loading";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
};

type Duty = {
  id: string;
  name: string;
};

export default function DutySettingsPage() {
  const router = useRouter();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [newDutyName, setNewDutyName] = useState<string>("");
  const [editDutyId, setEditDutyId] = useState<string | null>(null);
  const [editDutyName, setEditDutyName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 메시지 3초 후 사라지게 설정
  useEffect(() => {
    if (message) {
      setIsFadingOut(false);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => setMessage(""), 300);
      }, 2700);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 초기 데이터 로드
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
      if (decoded.role === "child") {
        setMessage("このページは子供用ではありません。");
        setIsLoading(false);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 당번 목록
        const dutiesRes = await fetch("/api/duty-assignments/duties", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dutiesData = await dutiesRes.json();
        if (dutiesRes.ok) setDuties(dutiesData);
        else setMessage(dutiesData.message || "データの取得に失敗しました。");
      } catch {
        setMessage("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 당번이름 추가
  const addDuty = async () => {
    if (!newDutyName.trim()) {
      setMessage("当番名を入力してください。");
      return;
    }
    try {
      const res = await fetch("/api/duty-assignments/duties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: newDutyName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDuties([...duties, data]);
        setNewDutyName("");
        setMessage("当番名を追加しました。");
      } else {
        setMessage(data.message || "当番名の追加に失敗しました。");
      }
    } catch {
      setMessage("当番名の追加に失敗しました。");
    }
  };

  // 당번이름 수정
  const updateDuty = async (id: string) => {
    if (!editDutyName.trim()) {
      setMessage("当番名を入力してください。");
      return;
    }
    try {
      const res = await fetch(`/api/duty-assignments/${id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: editDutyName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDuties(
          duties.map((duty) =>
            duty.id === id ? { ...duty, name: editDutyName } : duty
          )
        );
        setEditDutyId(null);
        setEditDutyName("");
        setMessage("当番名を更新しました。");
      } else {
        setMessage(data.message || "当番名の更新に失敗しました。");
      }
    } catch {
      setMessage("当番名の更新に失敗しました。");
    }
  };

  // 당번이름 삭제
  const deleteDuty = async (id: string) => {
    try {
      const res = await fetch(`/api/duty-assignments/${id}/edit`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setDuties(duties.filter((duty) => duty.id !== id));
        setMessage("当番名を削除しました。");
      } else {
        const data = await res.json();
        setMessage(data.message || "当番名の削除に失敗しました。");
      }
    } catch {
      setMessage("当番名の削除に失敗しました。");
    }
  };

  const getToken = (): string => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  if (message && !duties.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <p className="text-red-600 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">当番設定</h1>
        <button
          onClick={() => router.push("/duty")}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="dashboardへ戻る"
        >
          当番指定に戻る
        </button>
      </div>

      {message && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-md z-50 ${
            message.includes("失敗")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          } ${isFadingOut ? "animate-fade-out" : "animate-fade-in"}`}
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {/* 당번 설정 섹션 */}
      <div className="mb-8 p-4 bg-white rounded-xl border border-gray-300">
        <h2 className="text-lg font-semibold mb-4">当番設定</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={newDutyName}
            onChange={(e) => setNewDutyName(e.target.value)}
            placeholder="新しい当番名"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addDuty}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            追加
          </button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-400">
              <th className="border-b border-gray-200 p-2 text-left">当番名</th>
              <th className="border-b border-gray-200 p-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {duties.map((duty) => (
              <tr key={duty.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  {editDutyId === duty.id ? (
                    <input
                      type="text"
                      value={editDutyName}
                      onChange={(e) => setEditDutyName(e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    duty.name
                  )}
                </td>
                <td className="p-2 text-right flex gap-2 justify-end">
                  {editDutyId === duty.id ? (
                    <div className="flex gap-4.5">
                      <button
                        onClick={() => updateDuty(duty.id)}
                        className="text-green-500 hover:text-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditDutyId(null);
                          setEditDutyName("");
                        }}
                        className="text-gray-500 hover:text-gray-600 pr-2"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditDutyId(duty.id);
                          setEditDutyName(duty.name);
                        }}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteDuty(duty.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
