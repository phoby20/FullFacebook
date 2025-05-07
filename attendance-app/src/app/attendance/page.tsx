"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

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
      if (decoded.role === "child") {
        setMessage("출석 현황을 볼 권한이 없습니다.");
        setIsLoading(false);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    fetch(
      `/api/attendance/attendance?startDate=${startDate?.toISOString()}&endDate=${endDate?.toISOString()}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        } else {
          setChildren(data);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching attendance:", error);
        setMessage("출석 정보를 불러오지 못했습니다.");
        setIsLoading(false);
      });
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
    return <div className="p-6">로딩 중...</div>;
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
            // minDate={startDate}
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
                      new Date(a.date).toDateString() === date.toDateString()
                  );
                  return (
                    <td
                      key={date.toISOString()}
                      className={`border p-2 text-center ${
                        record?.checkedById ? "bg-green-300" : ""
                      }`}
                    >
                      {record ? (
                        <span
                          className={
                            record.checkedById ? "font-bold" : "text-red-500"
                          }
                        >
                          {record.checkedById ? "O" : "X"}
                        </span>
                      ) : (
                        "-"
                      )}
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
