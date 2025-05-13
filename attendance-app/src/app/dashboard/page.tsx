"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ChildrenSection } from "@/components/ChildrenSection";
import Loading from "@/components/Loading";
import Image from "next/image";
import { User } from "@/type/user";
import { Child } from "@/type/child";

type DecodedToken = {
  userId: string;
  exp: number;
  iat: number;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    {}
  );
  const [message, setMessage] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        setError("ログインが必要です");
        router.push("/login");
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(token);
        const userId = decoded.userId;

        const res = await fetch(`/api/users/${userId}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("ログインが必要か、または権限がありません");
            router.push("/login");
            return;
          }
          if (res.status === 404) {
            setError("ページが見つかりません");
            return;
          }
          throw new Error("ユーザーデータの取得に失敗しました");
        }

        const userData: User = await res.json();
        setUser(userData);
      } catch (err) {
        console.error("認証エラー:", err);
        setError("認証に失敗しました");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const childRes = await fetch("/api/child/list", {
          credentials: "include",
        });
        const childData = await childRes.json();
        setChildren(childData);
        childData.forEach((child: Child) => checkAttendanceStatus(child.id));

        const adminRes = await fetch("/api/admin/list", {
          credentials: "include",
        });
        const adminData = await adminRes.json();
        setAdmins(adminData);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 메시지 3초 후 사라지게 설정
  useEffect(() => {
    if (message) {
      setIsFadingOut(false);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => setMessage(""), 300); // 페이드 아웃 애니메이션 후 메시지 제거
      }, 2700); // 3초 - 애니메이션 시간(0.3초)
      return () => clearTimeout(timer);
    }
  }, [message]);

  const checkAttendanceStatus = async (childId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/status?childId=${childId}`, {
        credentials: "include",
      });
      const data = await res.json();
      setAttendanceMap((prev) => ({ ...prev, [childId]: data.checked }));
    } catch (err) {
      console.error("出欠確認エラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAttendance = async (childId: string) => {
    setIsLoading(true);
    try {
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
      setMessage(data.message || "処理完了");
      await checkAttendanceStatus(childId);
    } catch (err) {
      console.error("出欠処理エラー:", err);
      setMessage("処理に失敗しました");
    } finally {
      setIsLoading(false);
    }
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
        console.log("admin.photoPath:", admin.photoPath);
        return (
          <ChildrenSection
            key={admin.id}
            title={`${admin.name} 先生`}
            userPhotoPath={admin.photoPath}
            childList={adminChildren}
            attendanceMap={attendanceMap}
            onCheck={handleCheckAttendance}
            onEdit={handleEditChild}
          />
        );
      })}
      <ChildrenSection
        title="未割り当ての学生"
        userPhotoPath=""
        childList={children.filter((c) => !c.assignedAdminId)}
        attendanceMap={attendanceMap}
        onCheck={handleCheckAttendance}
        onEdit={handleEditChild}
      />
    </>
  );

  const renderAdminView = () => {
    if (!user) return null;
    const assigned = children.filter((c) => c.assignedAdminId === user.id);

    return (
      <>
        <div className="flex items-center gap-x-3 mb-6">
          <Image
            width={40}
            height={40}
            src={user.photoPath || "/default_user.png"}
            alt={user.id}
            className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
            sizes="80px"
          />
          <h2 className="text-xl font-semibold text-gray-800">
            {user.name} 先生
          </h2>
        </div>
        {assigned.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            担当の学生がいません
          </div>
        ) : null}
        <ChildrenSection
          title=""
          childList={assigned}
          userPhotoPath={user.photoPath}
          attendanceMap={attendanceMap}
          onCheck={handleCheckAttendance}
          onEdit={handleEditChild}
        />
        {assigned.length ? (
          <>
            <hr className="my-18 border-gray-200" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 pl-6">
              その他の学生
            </h2>
          </>
        ) : null}
        {admins.map((admin) => {
          if (admin.id === user.id) return null; // 自分のセクションはスキップ
          const adminChildren = children.filter(
            (child) => child.assignedAdminId === admin.id
          );
          return (
            <ChildrenSection
              key={admin.id}
              title={`${admin.name} 先生`}
              userPhotoPath={admin.photoPath}
              childList={adminChildren}
              attendanceMap={attendanceMap}
            />
          );
        })}
        <ChildrenSection
          title="未割り当ての学生"
          userPhotoPath=""
          childList={children.filter((c) => !c.assignedAdminId)}
          attendanceMap={attendanceMap}
        />
      </>
    );
  };

  if (error) {
    return <p className="p-4 text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3">
      {isLoading && <Loading />}
      <header className="p-2 pr-4 pl-4 mb-8 top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800 w-30">出席チェック</h1>
          <div className="flex gap-2">
            <button
              onClick={handleAddChild}
              className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
              aria-label="学生追加ボタン"
            >
              学生追加
            </button>
            {user && (user.role === "superAdmin" || user.role === "master") && (
              <button
                onClick={handleAddAdmin}
                className="cursor-pointer bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-300"
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
          className={`fixed bottom-4 right-4 max-w-sm p-4 bg-green-100 text-green-700 rounded-lg shadow-md z-50 ${
            isFadingOut ? "animate-fade-out" : "animate-fade-in"
          }`}
          aria-live="polite"
        >
          {message}
        </div>
      )}
      {user &&
        (user.role === "superAdmin"
          ? renderSuperAdminView()
          : renderAdminView())}
    </div>
  );
}
