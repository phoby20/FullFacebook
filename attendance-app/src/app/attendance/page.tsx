// app/attendance/page.tsx
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
  role: "master" | "superAdmin" | "admin" | "child";
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
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // KST 00:00
    return date; // 현재 날짜
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // KST 00:00
    return date; // 현재 날짜
  });
  const [message, setMessage] = useState<string>("");
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<
    "master" | "superAdmin" | "admin" | "child" | null
  >(null);

  // 로컬 날짜 문자열 생성 (KST 기준 YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

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

  const onCheck = async (childId: string, date: Date) => {
    setIsLoading(true);
    try {
      const child = children.find((c) => c.id === childId);
      if (!child) {
        setMessage("学生が見つかりません。");
        return;
      }
      const record = child.attendance.find(
        (a) =>
          new Date(a.date).toISOString().split("T")[0] ===
          getLocalDateString(date)
      );
      const checked = !!record?.checkedById;
      const requestBody = {
        childId,
        date: getLocalDateString(date),
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
                      getLocalDateString(date)
                  ),
                };
              }
              return child;
            })
          );
          setMessage("サーバーに出席記録がありません。");
          await refreshAttendanceData();
          return;
        }
        console.error("API error:", res.status, data.message);
        throw new Error(`API request failed with status ${res.status}`);
      }

      setMessage(data.message || "出席処理が完了しました。");
      setChildren((prevChildren) => {
        const newChildren = prevChildren.map((child) => {
          if (child.id === childId) {
            if (checked) {
              return {
                ...child,
                attendance: child.attendance.filter(
                  (a) =>
                    new Date(a.date).toISOString().split("T")[0] !==
                    getLocalDateString(date)
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
    } catch (error: unknown) {
      console.error("Error updating attendance:", error);
      setMessage("出席処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAttendanceData = async () => {
    setIsLoading(true);
    try {
      const start = startDate ? getLocalDateString(startDate) : "";
      const end = endDate ? getLocalDateString(endDate) : "";
      console.log("Fetching attendance data:", { start, end });

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
    } catch (error: unknown) {
      console.error("Error refreshing attendance:", error);
      setMessage("出席データの取得に失敗しました。");
    }
    setIsLoading(false);
  };

  // CSVダウンロード機能
  const downloadCSV = () => {
    if (!startDate || !endDate || children.length === 0) {
      setMessage("データがありません。");
      return;
    }

    const dateRange = getDateRange();
    const headers = [
      "学生名",
      ...dateRange.map((date) => getLocalDateString(date)),
    ];
    const rows = children.map((child) => {
      const row: string[] = [child.name];
      dateRange.forEach((date) => {
        const record = child.attendance.find(
          (a) =>
            new Date(a.date).toISOString().split("T")[0] ===
            getLocalDateString(date)
        );
        row.push(
          record?.checkedById ? "出席済み" : record ? "データなし" : "欠席"
        );
      });
      return row;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // UTF-8 BOM 추가 (Excel 일본어 깨짐 방지)
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_${getLocalDateString(startDate)}_${getLocalDateString(
        endDate
      )}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage("CSVをダウンロードしました。");
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
        setMessage("このページは子供用ではありません。");
        setIsLoading(false);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    refreshAttendanceData();
  }, [router, startDate, endDate]);

  const getToken = (): string => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  const getDateRange = (): Date[] => {
    if (!startDate || !endDate) return [];
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const getAttendanceCount = (date: Date): number => {
    return children.reduce((count, child) => {
      const hasAttendance = child.attendance.some(
        (a) =>
          new Date(a.date).toISOString().split("T")[0] ===
            getLocalDateString(date) && a.checkedById
      );
      return count + (hasAttendance ? 1 : 0);
    }, 0);
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

      <div className="p-3 bg-white rounded-xl border border-gray-300 mb-6">
        <p className="text-lg mb-2 pl-2">検索</p>
        <div className="mb-3 flex flex-row sm:flex-row gap-6">
          <div className="flex-1">
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              開始日
            </label>
            <DatePicker
              id="startDate"
              selected={startDate}
              onChange={(date: Date | null) => {
                if (date) {
                  date.setHours(0, 0, 0, 0); // KST 00:00
                  setStartDate(date);
                } else {
                  setStartDate(null);
                }
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="開始日選択"
              locale={ko}
              maxDate={endDate || new Date()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              aria-label="開始日選択"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              終了日
            </label>
            <DatePicker
              id="endDate"
              selected={endDate}
              onChange={(date: Date | null) => {
                if (date) {
                  date.setHours(0, 0, 0, 0); // KST 00:00
                  setEndDate(date);
                } else {
                  setEndDate(null);
                }
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="終了日選択"
              locale={ko}
              maxDate={new Date()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              aria-label="終了日選択"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={downloadCSV}
          className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
          aria-label="CSVをダウンロード"
        >
          CSVダウンロード
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-400">
              <th className="flex flex-col border-b border-gray-200 p-2 sticky left-0 bg-blue-400 min-w-[150px] rounded-tl-xl">
                <span>学生</span>
                <span className="text-xs text-gray-100 mt-1">
                  ({children.length}人)
                </span>
              </th>
              {dateRange.map((date) => (
                <th
                  key={date.toISOString()}
                  className="border-b border-gray-200 p-2 text-center min-w-[106px]"
                >
                  <div className="flex flex-col items-center">
                    <span>
                      {date
                        .toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })
                        .replace(/\./g, "/")
                        .replace(/\s/g, "")
                        .slice(0, -1)}
                    </span>
                    <span className="text-xs text-gray-100 mt-1">
                      ({getAttendanceCount(date)}人)
                    </span>
                  </div>
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
                        alt={`${child.name}の画像`}
                        className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <Image
                        width={48}
                        height={48}
                        src="/default_user.png"
                        alt="基本画像"
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
                      getLocalDateString(date)
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
                            className={`cursor-pointer w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 border-2 ${
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

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
          aria-label="dashboardへ戻る"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
