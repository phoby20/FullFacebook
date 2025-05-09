"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Loading from "@/components/Loading";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "child";
  groups: { group: { id: string; name: string } }[];
}

interface Group {
  id: string;
  name: string;
}

interface DecodedToken {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
}

export default function AssignGroupPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
      if (decoded.role !== "superAdmin") {
        router.push("/dashboard");
        return;
      }

      Promise.all([
        fetch("/api/superadmin/users").then((res) => {
          if (!res.ok) throw new Error("사용자 목록 조회 실패");
          return res.json();
        }),
        fetch("/api/superadmin/groups").then((res) => {
          if (!res.ok) throw new Error("그룹 목록 조회 실패");
          return res.json();
        }),
      ])
        .then(([userData, groupData]) => {
          setUsers(userData);
          setGroups(groupData);
          const initialAssignments = userData.reduce(
            (acc: { [key: string]: string }, user: User) => {
              acc[user.id] =
                user.groups.length > 0 ? user.groups[0].group.id : "";
              return acc;
            },
            {}
          );
          setAssignments(initialAssignments);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("데이터 조회 실패:", err);
          setError(
            err instanceof Error ? err.message : "데이터를 불러오지 못했습니다."
          );
          setIsLoading(false);
        });
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleAssign = async (userId: string) => {
    const groupId = assignments[userId];
    if (!groupId) {
      setError("그룹을 선택해주세요.");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/assign-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, groupId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "그룹 지정 실패");
      }
      setError("");
      alert("グループ指定完了");
      window.location.href = "/superadmin/assign-group";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "그룹 지정에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) {
      setError("グループ名を入力してください");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "그룹 생성 실패");
      }
      const newGroup: Group = await res.json();
      setGroups([...groups, newGroup]);
      setNewGroupName("");
      setError("");
      alert("グループ生成完了");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "그룹 생성에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading message="データを読み込んでいます..." />}
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          グループ指定
        </h1>

        {error && (
          <div
            className="mb-8 p-4 bg-red-100 text-red-700 rounded-lg shadow-md animate-fade-in"
            aria-live="polite"
            id="error-message"
          >
            {error}
          </div>
        )}

        {/* 그룹 생성 폼 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            新規グループ作成
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                error.includes("グループ名")
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="グループ名を入力してください"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              aria-describedby="error-message"
            />
            <button
              onClick={handleCreateGroup}
              disabled={isLoading}
              className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 w-40 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="グループ作成ボタン"
            >
              {isLoading ? "作成中..." : "グループ作成"}
            </button>
          </div>
        </div>

        {/* 사용자 목록 테이블 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  名前
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  現在のグループ
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  グループ指定
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="p-4 text-sm text-gray-800">{user.name}</td>
                  <td className="p-4 text-sm text-gray-800">
                    {user.groups.length > 0
                      ? user.groups[0].group.name
                      : "未指定"}
                  </td>
                  <td className="p-4">
                    <select
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        assignments[user.id] === "" &&
                        error.includes("グループを")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={assignments[user.id] || ""}
                      onChange={(e) =>
                        setAssignments({
                          ...assignments,
                          [user.id]: e.target.value,
                        })
                      }
                      aria-describedby="error-message"
                    >
                      <option value="" disabled>
                        グループを選択
                      </option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleAssign(user.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-label={`${user.name}にグループを指定`}
                    >
                      {isLoading ? "保存中..." : "保存"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="p-6 text-center text-gray-600">
              ユーザーが見つかりません。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
