// app/duty/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import Loading from "@/components/Loading";
import { getGrade } from "../../../utils/format";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
};

type Child = {
  id: string;
  name: string;
  birthDay: string;
};

type Duty = {
  id: string;
  name: string;
};

type DutyAssignment = {
  id: string;
  duty: Duty;
  child: Child;
  date: string;
  birthDay: string;
};

export default function DutyManagementPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [dutyAssignments, setDutyAssignments] = useState<DutyAssignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedDutyIds, setSelectedDutyIds] = useState<string[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    []
  );
  const [message, setMessage] = useState<string>("");
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssigning, setIsAssigning] = useState<boolean>(false); // New state for assigning
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // New state for deleting

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

  // 로컬 날짜 문자열 생성 (YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // 초기 데이터 로드
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
        setMessage("このページは子供用ではありません。");
        setIsLoading(false);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 학생 목록
        const childrenRes = await fetch("/api/children/list", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const childrenData = await childrenRes.json();
        if (childrenRes.ok) setChildren(childrenData);

        // 당번 목록
        const dutiesRes = await fetch("/api/duty-assignments/duties", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dutiesData = await dutiesRes.json();
        if (dutiesRes.ok) setDuties(dutiesData);

        // 당번 지정 목록
        const assignmentsRes = await fetch("/api/duty-assignments/assign", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const assignmentsData = await assignmentsRes.json();
        if (assignmentsRes.ok) setDutyAssignments(assignmentsData);
      } catch {
        setMessage("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 당번 지정 저장
  const assignDuty = async () => {
    if (!selectedDate || !selectedChildId || selectedDutyIds.length === 0) {
      setMessage("日付、学生、当番を選択してください。");
      return;
    }
    setIsAssigning(true); // Start loading
    try {
      const assignments = selectedDutyIds.map((dutyId) => ({
        dutyId,
        childId: selectedChildId,
        date: getLocalDateString(selectedDate),
      }));
      const res = await fetch("/api/duty-assignments/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(assignments),
      });
      const data = await res.json();
      if (res.ok) {
        setDutyAssignments([...dutyAssignments, ...data]);
        setSelectedDate(new Date());
        setSelectedChildId("");
        setSelectedDutyIds([]);
        setMessage("当番を指定しました。");
      } else {
        setMessage(data.message || "当番の指定に失敗しました。");
      }
    } catch {
      setMessage("当番の指定に失敗しました。");
    } finally {
      setIsAssigning(false); // Stop loading
    }
  };

  // 일괄 삭제 함수
  const deleteSelectedAssignments = async () => {
    if (selectedAssignmentIds.length === 0) {
      setMessage("삭제할 항목을 선택해주세요.");
      return;
    }
    setIsDeleting(true); // Start loading
    try {
      const res = await fetch("/api/duty-assignments/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ids: selectedAssignmentIds }),
      });
      if (res.ok) {
        setDutyAssignments(
          dutyAssignments.filter((a) => !selectedAssignmentIds.includes(a.id))
        );
        setSelectedAssignmentIds([]);
        setMessage("選択した当番指定を削除しました。");
      } else {
        const data = await res.json();
        setMessage(data.message || "削除에 실패しました。");
      }
    } catch {
      setMessage("削除에失敗しました。");
    } finally {
      setIsDeleting(false); // Stop loading
    }
  };

  const getToken = (): string => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || ""
    );
  };

  // 당번별로 그룹화된 데이터 생성
  const groupedAssignments = dutyAssignments.reduce((acc, assignment) => {
    const dutyName = assignment.duty.name;
    if (!acc[dutyName]) {
      acc[dutyName] = [];
    }
    acc[dutyName].push(assignment);
    return acc;
  }, {} as { [key: string]: DutyAssignment[] });

  // 각 당번 내에서 날짜순으로 정렬
  Object.keys(groupedAssignments).forEach((dutyName) => {
    groupedAssignments[dutyName].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  // 초기 로딩 또는 API 호출 중 로딩 표시
  if (isLoading) {
    return <Loading />;
  }

  if (message && !children.length && !duties.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <p className="text-red-600 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* API 호출 중 로딩 오버레이 */}
      {(isAssigning || isDeleting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">当番管理</h1>
        <button
          onClick={() => router.push("/duty-settings")}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="당번 설정 페이지로 이동"
        >
          当番名新規登録
        </button>
      </div>

      {message && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-md z-50 ${
            message.includes("失敗") || message.includes("삭제할")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          } ${isFadingOut ? "animate-fade-out" : "animate-fade-in"}`}
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {/* 당번 지정 및 설정 현황 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 당번 지정 */}
        <div className="p-4 bg-white rounded-xl border border-gray-300">
          <h2 className="text-lg font-semibold mb-4">当番指定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日付
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="日付を選択"
                locale={ko}
                // minDate={new Date()} // 과거 날짜 선택 불가
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="日付を選択"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学生
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">学生を選択</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} ({getGrade(child.birthDay)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当番
              </label>
              <div className="flex flex-wrap gap-4">
                {duties.map((duty) => (
                  <label key={duty.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDutyIds.includes(duty.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDutyIds([...selectedDutyIds, duty.id]);
                        } else {
                          setSelectedDutyIds(
                            selectedDutyIds.filter((id) => id !== duty.id)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                    />
                    <span>{duty.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={assignDuty}
                disabled={isAssigning} // Disable button during API call
                className={`w-24 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isAssigning ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>

        {/* 설정 현황 - 당번별 */}
        <div className="p-4 bg-white rounded-xl border border-gray-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">設定現況（当番別）</h2>
            <button
              onClick={deleteSelectedAssignments}
              disabled={selectedAssignmentIds.length === 0 || isDeleting}
              className={`px-4 py-2 rounded-lg text-white ${
                selectedAssignmentIds.length === 0 || isDeleting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              aria-label="선택한 당번 지정 삭제"
            >
              選択削除
            </button>
          </div>
          {Object.keys(groupedAssignments).length === 0 ? (
            <p className="text-gray-500">当番指定がありません。</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedAssignments).map((dutyName) => (
                <div
                  key={dutyName}
                  className="border-b border-gray-200 pb-4 mb-10"
                >
                  <h3 className="font-bold text-lg mb-2">{dutyName}</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border-b border-gray-200 p-2 w-12">
                          <input
                            type="checkbox"
                            checked={
                              groupedAssignments[dutyName].length > 0 &&
                              groupedAssignments[dutyName].every((a) =>
                                selectedAssignmentIds.includes(a.id)
                              )
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssignmentIds([
                                  ...selectedAssignmentIds,
                                  ...groupedAssignments[dutyName]
                                    .map((a) => a.id)
                                    .filter(
                                      (id) =>
                                        !selectedAssignmentIds.includes(id)
                                    ),
                                ]);
                              } else {
                                setSelectedAssignmentIds(
                                  selectedAssignmentIds.filter(
                                    (id) =>
                                      !groupedAssignments[dutyName]
                                        .map((a) => a.id)
                                        .includes(id)
                                  )
                                );
                              }
                            }}
                            className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                            aria-label={`${dutyName} 전체 선택`}
                          />
                        </th>
                        <th className="border-b border-gray-200 p-2 text-left">
                          日付
                        </th>
                        <th className="border-b border-gray-200 p-2 text-left">
                          学生
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedAssignments[dutyName].map((assignment) => (
                        <tr
                          key={assignment.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-2 w-12">
                            <input
                              type="checkbox"
                              checked={selectedAssignmentIds.includes(
                                assignment.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssignmentIds([
                                    ...selectedAssignmentIds,
                                    assignment.id,
                                  ]);
                                } else {
                                  setSelectedAssignmentIds(
                                    selectedAssignmentIds.filter(
                                      (id) => id !== assignment.id
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                              aria-label={`${assignment.child.name} 당번 지정 선택`}
                            />
                          </td>
                          <td className="p-2">
                            {new Date(assignment.date).toLocaleDateString(
                              "ko-KR"
                            )}
                          </td>
                          <td className="p-2">
                            {assignment.child.name} (
                            {getGrade(assignment.child.birthDay)})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
