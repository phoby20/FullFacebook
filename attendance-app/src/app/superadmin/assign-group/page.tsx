"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

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

      // 단체 내 사용자 목록 조회
      fetch("/api/superadmin/users")
        .then((res) => {
          if (!res.ok) throw new Error("사용자 목록 조회 실패");
          return res.json();
        })
        .then((data: User[]) => {
          setUsers(data);
          const initialAssignments = data.reduce(
            (acc: { [key: string]: string }, user: User) => {
              acc[user.id] =
                user.groups.length > 0 ? user.groups[0].group.id : "";
              return acc;
            },
            {}
          );
          setAssignments(initialAssignments);
        })
        .catch((err: unknown) => {
          console.error("사용자 조회 실패:", err);
          setError(
            err instanceof Error
              ? err.message
              : "사용자 목록을 불러오지 못했습니다."
          );
        });

      // 그룹 목록 조회
      fetch("/api/superadmin/groups")
        .then((res) => {
          if (!res.ok) throw new Error("그룹 목록 조회 실패");
          return res.json();
        })
        .then((data: Group[]) => setGroups(data))
        .catch((err: unknown) => {
          console.error("그룹 조회 실패:", err);
          setError(
            err instanceof Error
              ? err.message
              : "그룹 목록을 불러오지 못했습니다."
          );
        });

      setIsLoading(false);
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
      alert("그룹 지정 완료");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "그룹 지정에 실패했습니다."
      );
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) {
      setError("그룹 이름을 입력해주세요.");
      return;
    }

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
      alert("그룹 생성 완료");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "그룹 생성에 실패했습니다."
      );
    }
  };

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl mb-4">그룹 지정</h1>
      {error && (
        <p className="text-red-500 mb-4" aria-live="polite">
          {error}
        </p>
      )}

      {/* 그룹 생성 폼 */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">새 그룹 생성</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="border p-2 w-full border-gray-300"
            placeholder="그룹 이름을 입력해주세요"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            onClick={handleCreateGroup}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            그룹 생성
          </button>
        </div>
      </div>

      {/* 사용자 목록 테이블 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">이름</th>
            <th className="border p-2 text-left">이메일</th>
            <th className="border p-2 text-left">역할</th>
            <th className="border p-2 text-left">현재 그룹</th>
            <th className="border p-2 text-left">그룹 지정</th>
            <th className="border p-2 text-left">액션</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">
                {user.groups.length > 0 ? user.groups[0].group.name : "미지정"}
              </td>
              <td className="border p-2">
                <select
                  className="border p-2 w-full"
                  value={assignments[user.id] || ""}
                  onChange={(e) =>
                    setAssignments({
                      ...assignments,
                      [user.id]: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    그룹 선택
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border p-2">
                <button
                  onClick={() => handleAssign(user.id)}
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                >
                  저장
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="mt-4 text-gray-600">사용자가 없습니다.</p>
      )}
    </div>
  );
}
