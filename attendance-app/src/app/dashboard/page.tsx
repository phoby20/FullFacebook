"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ChildrenSection } from "@/components/ChildrenSection";
import Loading from "@/components/Loading";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
  exp: number;
  iat: number;
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
  managerId: string;
  assignedAdminId: string | null;
  createdAt: Date;
};

type User = {
  id: string;
  name: string;
};

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    {}
  );
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) return router.push("/login");

    try {
      const decoded: DecodedToken = jwtDecode(token);
      setRole(decoded.role);
      setUserId(decoded.userId);
      setIsLoading(false);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/child/list")
      .then((res) => res.json())
      .then((data) => {
        setChildren(data);
        data.forEach((child: Child) => checkAttendanceStatus(child.id));
      });

    if (role === "superAdmin") {
      fetch("/api/admin/list")
        .then((res) => res.json())
        .then((data) => setAdmins(data));
    }
    setIsLoading(false);
  }, [role]);

  const checkAttendanceStatus = async (childId: string) => {
    setIsLoading(true);
    const res = await fetch(`/api/attendance/status?childId=${childId}`, {
      credentials: "include",
    });
    const data = await res.json();
    setAttendanceMap((prev) => ({ ...prev, [childId]: data.checked }));
    setIsLoading(false);
  };

  const handleCheckAttendance = async (childId: string) => {
    setIsLoading(true);
    const checked = attendanceMap[childId];
    const endpoint = checked
      ? "/api/attendance/uncheck"
      : "/api/attendance/check";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ childId }),
    });

    const data = await res.json();
    setMessage(data.message || "処理完了!");
    checkAttendanceStatus(childId);
    setIsLoading(false);
  };

  const handleEditChild = (childId: string) =>
    router.push(`/child/edit/${childId}`);

  const handleAddChild = () => router.push("/child/add");
  const handleAddAdmin = () => router.push("/register");

  const renderSuperAdminView = () => (
    <>
      {admins.map((admin) => {
        const adminChildren = children.filter(
          (child) => child.assignedAdminId === admin.id
        );
        return (
          <ChildrenSection
            key={admin.id}
            title={`${admin.name} 先生`}
            childList={adminChildren}
            attendanceMap={attendanceMap}
            onCheck={handleCheckAttendance}
            onEdit={handleEditChild}
          />
        );
      })}
      <ChildrenSection
        title="未割り当て学生"
        childList={children.filter((c) => !c.assignedAdminId)}
        attendanceMap={attendanceMap}
        onCheck={handleCheckAttendance}
        onEdit={handleEditChild}
      />
    </>
  );

  const renderAdminView = () => {
    const assigned = children.filter((c) => c.assignedAdminId === userId);
    const others = children.filter((c) => c.assignedAdminId !== userId);

    return (
      <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">担当学生</h2>
        </div>
        {assigned.length === 0 ? (
          <div className="text-gray-500">担当学生がいません</div>
        ) : null}
        <ChildrenSection
          title=""
          childList={assigned}
          attendanceMap={attendanceMap}
          onCheck={handleCheckAttendance}
          onEdit={handleEditChild}
        />
        {assigned.length ? (
          <hr className="my-4 border-gray-300 mt-10 mb-10" />
        ) : null}

        <ChildrenSection
          title="その他の学生"
          childList={others}
          attendanceMap={attendanceMap}
        />
      </>
    );
  };

  return (
    <div className="p-6">
      {isLoading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">出席チェック</h1>
        <div className="flex gap-4">
          <button
            onClick={handleAddChild}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            学生追加
          </button>
          {role === "superAdmin" || role === "master" ? (
            <button
              onClick={handleAddAdmin}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              先生追加
            </button>
          ) : null}
        </div>
      </div>

      {message && (
        <div className="text-green-600 font-bold text-lg" aria-live="polite">
          {message}
        </div>
      )}
      {role === "superAdmin" ? renderSuperAdminView() : renderAdminView()}
    </div>
  );
}
