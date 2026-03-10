// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ChildrenSection } from "@/components/ChildrenSection";
import Loading from "@/components/Loading";
import Image from "next/image";
import { Child } from "@/types/child";
import { User } from "@/types/user";
import { formatInTimeZone } from "date-fns-tz";
import GraduationNoticeModal from "@/components/GraduationNoticeModal";

type DecodedToken = {
  userId: string;
  exp: number;
  iat: number;
};

type DutyAssignment = {
  id: string;
  duty: { id: string; name: string };
  child: { id: string; name: string; birthDay: string };
  date: string;
};

type GraduationStudent = {
  id: string;
  name: string;
  birthDay: string;
  photoPath: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thisMonthBirthdays, setThisMonthBirthdays] = useState<string[]>([]);
  const [nextMonthBirthdays, setNextMonthBirthdays] = useState<string[]>([]);
  const [thisWeekDuties, setThisWeekDuties] = useState<DutyAssignment[]>([]);
  const [nextWeekDuties, setNextWeekDuties] = useState<DutyAssignment[]>([]);
  const [isOpen, setIsOpen] = useState(true); // Default: accordion open
  const [students, setStudents] = useState<GraduationStudent[]>([]);
  const router = useRouter();

  const [graduationNoticeOpen, setGraduationNoticeOpen] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem("hideGraduationNoticeUntil");

    if (hiddenUntil && Date.now() < Number(hiddenUntil)) {
      return;
    }

    fetch("/api/dashboard/graduation-candidates")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setStudents(data);
          setGraduationNoticeOpen(true);
        }
      });
  }, []);

  const jstTimeZone = "Asia/Tokyo";
  const todayJst = new Date(
    formatInTimeZone(new Date(), jstTimeZone, "yyyy-MM-dd'T00:00:00.000Z"),
  );

  // 주간 범위 계산 함수
  const getWeekRange = (baseDate: Date) => {
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { start: startOfWeek, end: endOfWeek };
  };

  // 날짜 범위 포맷팅 함수
  const formatWeekRange = (start: Date): string => {
    const endFormatted = start.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
    return `${endFormatted}`;
  };

  // 아코디언 토글 함수
  const toggleAccordion = () => {
    setIsOpen((prev) => !prev);
  };

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
        // 학생 목록
        const childRes = await fetch("/api/child/list", {
          credentials: "include",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!childRes.ok) throw new Error("학생 목록 가져오기 실패");
        const childData = await childRes.json();
        setChildren(childData);
        childData.forEach((child: Child) => checkAttendanceStatus(child.id));

        // 관리자 목록
        const adminRes = await fetch("/api/admin/list", {
          credentials: "include",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!adminRes.ok) throw new Error("관리자 목록 가져오기 실패");
        const adminData = await adminRes.json();
        setAdmins(adminData);

        // 당번 목록
        const dutyRes = await fetch("/api/duty-assignments/assign", {
          credentials: "include",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!dutyRes.ok) throw new Error("당번 목록 가져오기 실패");
        const dutyData = await dutyRes.json();

        // 이번 주와 다음 주 당번 필터링

        const thisWeek = getWeekRange(todayJst);
        const nextWeek = getWeekRange(
          new Date(todayJst.getTime() + 7 * 24 * 60 * 60 * 1000),
        );

        const thisWeekDuties = dutyData.filter((duty: DutyAssignment) => {
          const dutyDate = new Date(duty.date);
          return dutyDate >= thisWeek.start && dutyDate <= thisWeek.end;
        });
        const nextWeekDuties = dutyData.filter((duty: DutyAssignment) => {
          const dutyDate = new Date(duty.date);
          return dutyDate >= nextWeek.start && dutyDate <= nextWeek.end;
        });

        setThisWeekDuties(thisWeekDuties);
        setNextWeekDuties(nextWeekDuties);

        // 생일 데이터 처리
        processBirthdays(adminData, childData);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 토큰 가져오기 함수
  const getToken = (): string => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  // 생일 데이터 처리 함수
  const processBirthdays = (admins: User[], children: Child[]) => {
    const now = new Date();
    const thisMonth = now.getMonth() + 1; // 1~12
    const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;

    const thisMonthNames: string[] = [];
    const nextMonthNames: string[] = [];

    // 선생님 생일 확인
    admins.forEach((admin) => {
      if (admin.birthDay) {
        const birthDate = new Date(admin.birthDay);
        const birthMonth = birthDate.getMonth() + 1;
        if (birthMonth === thisMonth) {
          thisMonthNames.push(`${admin.name} 先生`);
        } else if (birthMonth === nextMonth) {
          nextMonthNames.push(`${admin.name} 先生`);
        }
      }
    });

    // 학생 생일 확인
    children.forEach((child) => {
      if (child.birthDay) {
        const birthDate = new Date(child.birthDay);
        const birthMonth = birthDate.getMonth() + 1;
        if (birthMonth === thisMonth) {
          thisMonthNames.push(child.name);
        } else if (birthMonth === nextMonth) {
          nextMonthNames.push(child.name);
        }
      }
    });

    setThisMonthBirthdays(thisMonthNames);
    setNextMonthBirthdays(nextMonthNames);
  };

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

  const checkAttendanceStatus = async (childId: string) => {
    try {
      const res = await fetch(`/api/attendance/status?childId=${childId}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setAttendanceMap((prev) => ({ ...prev, [childId]: data.checked }));
    } catch (err) {
      console.error("出欠確認エラー:", err);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
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

  const handleAddAdmin = () => router.push("/register");

  const renderSuperAdminView = () => (
    <>
      {admins.map((admin) => {
        const adminChildren = children.filter(
          (child) => child.assignedAdminId === admin.id,
        );
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
        <div className="flex items-center gap-x-3 mb-6 pl-4">
          <Image
            width={40}
            height={40}
            src={user.photoPath || "/default_user.png"}
            alt={user.id}
            className="w-14 h-14 object-cover rounded-full border-2 border-fuchsia-400"
            sizes="80px"
          />
          <h2 className="text-lg font-semibold text-gray-800">
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
            (child) => child.assignedAdminId === admin.id,
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

  // 이번 주와 다음 주 날짜 범위 계산
  todayJst.setDate(todayJst.getDate());
  const thisWeek = getWeekRange(todayJst);
  const nextWeek = getWeekRange(
    new Date(todayJst.getTime() + 7 * 24 * 60 * 60 * 1000),
  );
  const thisWeekRange = formatWeekRange(thisWeek.start);
  const nextWeekRange = formatWeekRange(nextWeek.start);

  return (
    <div>
      {/* 생일 및 당번 섹션 (단일 아코디언) */}
      <div
        className="bg-white rounded-lg shadow-md text-xs"
        aria-label="お知らせ"
      >
        <div className="border-b border-gray-200">
          <button
            type="button"
            className="w-full bg-red-200 pl-3 pr-3 flex justify-between items-center py-2 text-left font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleAccordion}
            aria-expanded={isOpen}
            aria-controls="accordion-content"
          >
            <span className="text-sm">📅 お知らせ</span>
            <svg
              className={`w-5 h-5 transform transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            id="accordion-content"
            className={`overflow-hidden pl-3 transition-all duration-200 ${
              isOpen ? "max-h-[1000px] opacity-100 py-2" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-2">
              {/* 생일 섹션 */}
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-gray-700">
                  🎉 今月の誕生日 ({thisMonthBirthdays.length}人)
                </h3>
                {thisMonthBirthdays.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {thisMonthBirthdays.map((name, index) => (
                      <span
                        key={index}
                        className="text-gray-500 bg-gray-200 rounded-full px-2"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">今月の誕生日はありません</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-gray-700">
                  👏 来月の誕生日 ({nextMonthBirthdays.length}人)
                </h3>
                {nextMonthBirthdays.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {nextMonthBirthdays.map((name, index) => (
                      <span
                        key={index}
                        className="text-gray-500 bg-gray-200 rounded-full px-2"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">来月の誕生日はありません</p>
                )}
              </div>
              {/* 이번 주 당번 섹션 */}
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-gray-700">
                  🔔 今週の当番 ({thisWeekRange})
                </h3>
                {thisWeekDuties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {thisWeekDuties.map((duty, index) => (
                      <span
                        key={index}
                        className="text-gray-500 bg-gray-200 rounded-full px-2"
                      >
                        {duty.duty.name} - {duty.child.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">今週の当番はありません</p>
                )}
              </div>
              {/* 다음 주 당번 섹션 */}
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-gray-700">
                  🔔 来週の当番 ({nextWeekRange})
                </h3>
                {nextWeekDuties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {nextWeekDuties.map((duty, index) => (
                      <span
                        key={index}
                        className="text-gray-500 bg-gray-200 rounded-full px-2"
                      >
                        {duty.duty.name} - {duty.child.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">来週の当番はありません</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3">
        {isLoading && <Loading />}

        <header className="p-2 pr-4 pl-4 mb-8 mt-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 w-30">
              出席チェック
            </h1>
            <div className="flex gap-2">
              {user &&
                (user.role === "superAdmin" || user.role === "master") && (
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

      {graduationNoticeOpen && (
        <GraduationNoticeModal
          students={students}
          onClose={() => setGraduationNoticeOpen(false)}
        />
      )}
    </div>
  );
}
