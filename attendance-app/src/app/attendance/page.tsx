"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import Loading from "@/components/Loading";

type DecodedToken = {
  userId: string;
  role: "superAdmin" | "admin" | "child";
};

type Attendance = {
  id: string;
  date: string;
  checkedById: string;
};

type Child = {
  id: string;
  name: string;
  photoPath: string;
  assignedAdminId: string | null;
  attendance: Attendance[];
};

export default function AllAttendancePage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 1))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<
    "superAdmin" | "admin" | "child" | null
  >(null);

  const onCheck = async (childId: string, date: Date) => {
    setIsLoading(true);
    try {
      const child = children.find((c) => c.id === childId);
      if (!child) {
        setMessage("학생을 찾을 수 없습니다.");
        return;
      }
      const record = child.attendance.find(
        (a) =>
          new Date(a.date).toISOString().split("T")[0] ===
          date.toISOString().split("T")[0]
      );
      const checked = !!record?.checkedById;
      const requestBody = {
        childId,
        date: new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0],
        action: checked ? "uncheck" : "check",
      };

      const res = await fetch("/api/attendance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 && checked) {
          setChildren((prevChildren) =>
            prevChildren.map((child) => {
              if (child.id === childId) {
                return {
                  ...child,
                  attendance: child.attendance.filter(
                    (a) =>
                      new Date(a.date).toISOString().split("T")[0] !==
                      date.toISOString().split("T")[0]
                  ),
                };
              }
              return child;
            })
          );
          setMessage("서버에 출석 기록이 없어 로컬 상태를 업데이트했습니다.");
          await refreshAttendanceData();
          return;
        }
        console.error("API error:", res.status, data.message);
        throw new Error(`API request failed with status ${res.status}`);
      }

      setMessage(data.message || "처리 완료!");
      setChildren((prevChildren) => {
        const newChildren = prevChildren.map((child) => {
          if (child.id === childId) {
            if (checked) {
              return {
                ...child,
                attendance: child.attendance.filter(
                  (a) =>
                    new Date(a.date).toISOString().split("T")[0] !==
                    date.toISOString().split("T")[0]
                ),
              };
            } else {
              return {
                ...child,
                attendance: [
                  ...child.attendance,
                  {
                    id: data.attendance?.id || `temp-${Date.now()}`,
                    date: data.attendance?.date || date.toISOString(),
                    checkedById: data.attendance?.checkedById || "admin",
                  },
                ],
              };
            }
          }
          return child;
        });
        return newChildren;
      });

      await refreshAttendanceData();
    } catch (error) {
      console.error("Error updating attendance:", error);
      setMessage("출석 상태를 업데이트하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAttendanceData = async () => {
    setIsLoading(true);
    try {
      const start = startDate ? startDate.toISOString().split("T")[0] : "";
      const end = endDate ? endDate.toISOString().split("T")[0] : "";

      const res = await fetch(
        `/api/attendance/attendance?startDate=${start}&endDate=${end}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
      } else {
        setChildren(data);
      }
    } catch (error) {
      console.error("Error refreshing attendance:", error);
      setMessage("출석 정보를 새로고치지 못했습니다.");
    }
    setIsLoading(false);
  };

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
      setUserId(decoded.userId);
      setUserRole(decoded.role);
      if (decoded.role === "child") {
        setMessage("출석 현황을 볼 권한이 없습니다.");
        setIsLoading(false);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    refreshAttendanceData();
  }, [router, startDate, endDate]);

  const getToken = () => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  const getDateRange = () => {
    if (!startDate || !endDate) return [];
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dateRange = getDateRange();

  if (isLoading) {
    return <Loading />;
  }

  if (message && !children.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <p className="text-red-600 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3">
      <h1 className="text-xl font-bold text-gray-800 mb-8">全学生出席状況</h1>

      {message && (
        <div
          className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md animate-fade-in"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            スタート日
          </label>
          <DatePicker
            id="startDate"
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="시작 날짜 선택"
            locale={ko}
            maxDate={endDate || new Date()}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            aria-label="開始日を選択"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            エンド日
          </label>
          <DatePicker
            id="endDate"
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="종료 날짜 선택"
            locale={ko}
            maxDate={new Date()}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            aria-label="終了日を選択"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-400">
              <th className="border-b border-gray-200 p-2 text-left sticky left-0 bg-blue-400 min-w-[150px] rounded-tl-xl">
                学生
              </th>
              {dateRange.map((date) => (
                <th
                  key={date.toISOString()}
                  className="border-b border-gray-200 p-2 text-center min-w-[106px]"
                >
                  {date
                    .toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })
                    .replace(/\./g, "/")
                    .replace(/\s/g, "")
                    .slice(0, -1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children.map((child) => (
              <tr
                key={child.id}
                className="border-b hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="border-r border-gray-200 p-2 sticky left-0 bg-white">
                  <div className="flex items-center gap-1 flex-col sm:flex-row">
                    {child.photoPath ? (
                      <Image
                        width={48}
                        height={48}
                        src={child.photoPath}
                        alt={`${child.name}の写真`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <Image
                        width={48}
                        height={48}
                        src="/default_user.png"
                        alt="기본 이미지"
                        className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                      />
                    )}
                    <span className="font-semibold text-gray-800 text-xs">
                      {child.name}
                    </span>
                  </div>
                </td>
                {dateRange.map((date) => {
                  const record = child.attendance.find(
                    (a) =>
                      new Date(a.date).toISOString().split("T")[0] ===
                      date.toISOString().split("T")[0]
                  );
                  const canCheckAttendance =
                    userRole === "superAdmin" ||
                    userId === child.assignedAdminId;

                  return (
                    <td
                      key={date.toISOString()}
                      className={`border-r border-gray-200 p-2 text-center ${
                        record?.checkedById ? "bg-green-100" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span
                          className={`text-lg ${
                            record?.checkedById
                              ? "text-green-600 font-bold"
                              : record
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {record?.checkedById ? "✓" : record ? "✗" : "−"}
                        </span>
                        {canCheckAttendance && (
                          <button
                            onClick={() => onCheck(child.id, date)}
                            className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 border-2 ${
                              record?.checkedById
                                ? "border-red-500 text-red-500 hover:border-red-600 hover:text-red-600 focus:ring-red-500"
                                : "border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600 focus:ring-blue-500"
                            } bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-2`}
                            aria-label={
                              record?.checkedById ? "キャンセル" : "出席"
                            }
                          >
                            {record?.checkedById ? "キャンセル" : "出席"}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
          aria-label="ダッシュボードに戻る"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
