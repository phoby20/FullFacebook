"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  organizations: { organization: { id: string; name: string } }[];
}

interface Organization {
  id: string;
  name: string;
}

interface DecodedToken {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
}

export default function AssignOrganizationPage() {
  const router = useRouter();
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newOrgName, setNewOrgName] = useState("");
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
      if (decoded.role !== "master") {
        router.push("/dashboard");
        return;
      }

      // superAdmin 목록 조회
      fetch("/api/master/superadmins")
        .then((res) => {
          if (!res.ok) throw new Error("superAdmin 목록 조회 실패");
          return res.json();
        })
        .then((data: SuperAdmin[]) => {
          setSuperAdmins(data);
          const initialAssignments = data.reduce(
            (acc: { [key: string]: string }, user: SuperAdmin) => {
              acc[user.id] =
                user.organizations.length > 0
                  ? user.organizations[0].organization.id
                  : "";
              return acc;
            },
            {}
          );
          setAssignments(initialAssignments);
        })
        .catch((err: unknown) => {
          console.error("superAdmin 조회 실패:", err);
          setError(
            err instanceof Error
              ? err.message
              : "superAdmin 목록을 불러오지 못했습니다."
          );
        });

      // 단체 목록 조회
      fetch("/api/master/organizations")
        .then((res) => {
          if (!res.ok) throw new Error("단체 목록 조회 실패");
          return res.json();
        })
        .then((data: Organization[]) => setOrganizations(data))
        .catch((err: unknown) => {
          console.error("단체 조회 실패:", err);
          setError(
            err instanceof Error
              ? err.message
              : "단체 목록을 불러오지 못했습니다."
          );
        });

      setIsLoading(false);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleAssign = async (userId: string) => {
    const organizationId = assignments[userId];
    if (!organizationId) {
      setError("단체를 선택해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/master/assign-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, organizationId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "단체 지정 실패");
      }
      alert("단체 지정 완료");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "단체 지정에 실패했습니다."
      );
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName) {
      setError("단체 이름을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/master/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "단체 생성 실패");
      }
      const newOrg: Organization = await res.json();
      setOrganizations([...organizations, newOrg]);
      setNewOrgName("");
      alert("단체 생성 완료");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "단체 생성에 실패했습니다."
      );
    }
  };

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl mb-4">superAdmin 단체 지정</h1>
      {error && (
        <p className="text-red-500 mb-4" aria-live="polite">
          {error}
        </p>
      )}

      {/* 단체 생성 폼 */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">새 단체 생성</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="border p-2 w-full border-gray-300"
            placeholder="단체 이름을 입력해주세요"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <button
            onClick={handleCreateOrganization}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-3xs"
          >
            단체 생성
          </button>
        </div>
      </div>

      {/* superAdmin 목록 테이블 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">이름</th>
            <th className="border p-2 text-left">이메일</th>
            <th className="border p-2 text-left">현재 단체</th>
            <th className="border p-2 text-left">단체 지정</th>
            <th className="border p-2 text-left">액션</th>
          </tr>
        </thead>
        <tbody>
          {superAdmins.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">
                {user.organizations.length > 0
                  ? user.organizations[0].organization.name
                  : "미지정"}
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
                    단체 선택
                  </option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
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

      {superAdmins.length === 0 && (
        <p className="mt-4 text-gray-600">superAdmin 사용자가 없습니다.</p>
      )}
    </div>
  );
}
