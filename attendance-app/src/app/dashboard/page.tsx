"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ChildrenSection } from "@/components/ChildrenSection";
import Loading from "@/components/Loading";
import Image from "next/image";

type DecodedToken = {
  userId: string;
  photoPath: string;
  userName: string;
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
  const [userPhoto, setUserPhoto] = useState("");
  const [userName, setUserName] = useState("");
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
      setUserName(decoded.userName);
      setUserPhoto(decoded.photoPath || "");
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
        <div className="flex items-center gap-x-3 mb-6">
          <Image
            width={40}
            height={40}
            src={userPhoto || "/default_user.png"}
            alt={userId}
            className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
            sizes="80px"
          />
          <h2 className="text-xl font-semibold text-gray-800">
            {userName}先生
          </h2>
        </div>
        {assigned.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            担当学生がいません
          </div>
        ) : null}
        <ChildrenSection
          title=""
          childList={assigned}
          attendanceMap={attendanceMap}
          onCheck={handleCheckAttendance}
          onEdit={handleEditChild}
        />
        {assigned.length ? <hr className="my-8 border-gray-200" /> : null}
        <ChildrenSection
          title="その他の学生"
          childList={others}
          attendanceMap={attendanceMap}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3">
      {isLoading && <Loading />}
      <header className="p-2 pr-4 pl-4 mb-8 top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 w-30">出席チェック</h1>
          <div className="flex gap-2">
            <button
              onClick={handleAddChild}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
              aria-label="学生追加ボタン"
            >
              学生追加
            </button>
            {(role === "superAdmin" || role === "master") && (
              <button
                onClick={handleAddAdmin}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-300"
                aria-label="先生追加ボタン"
              >
                先生追加
              </button>
            )}
          </div>
        </div>
      </header>

      {message && (
        <div
          className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg shadow-md animate-fade-in"
          aria-live="polite"
        >
          {message}
        </div>
      )}
      {role === "superAdmin" ? renderSuperAdminView() : renderAdminView()}
    </div>
  );
}
