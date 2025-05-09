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
      <div className="p-6">
        <p className="text-red-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">全学生出席現状</h1>
      {message && (
        <div className="mb-4 text-red-500" aria-live="polite">
          {message}
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
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
            className="border p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
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
            className="border p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left sticky left-0 bg-gray-100 min-w-[120px]">
                学生
              </th>
              {dateRange.map((date) => (
                <th
                  key={date.toISOString()}
                  className="border p-2 text-center min-w-[80px]"
                >
                  {date.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children.map((child) => (
              <tr key={child.id} className="border-b">
                <td className="border p-2 sticky left-0 bg-white">
                  {child.photoPath ? (
                    <Image
                      width={500}
                      height={500}
                      src={child.photoPath}
                      alt={`${child.name}の写真`}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <Image
                      width={500}
                      height={500}
                      src="/default_user.png"
                      alt="기본 이미지"
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  )}
                  {child.name}
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
                      className={`border p-2 text-center ${
                        record?.checkedById ? "bg-green-300" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span
                          className={
                            record?.checkedById ? "font-bold" : "text-red-500"
                          }
                        >
                          {record?.checkedById ? "O" : record ? "X" : "-"}
                        </span>
                        {canCheckAttendance && (
                          <button
                            onClick={() => onCheck(child.id, date)}
                            className={`w-35 px-4 py-2 rounded text-white ${
                              record?.checkedById
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {record?.checkedById
                              ? "出席キャンセル"
                              : "出席チェック"}
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

      <div className="mt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
