"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Loading from "@/components/Loading";

type Admin = {
  id: string;
  name: string;
  assignedChildren: {
    id: string;
    name: string;
    photoPath: string;
    birthDay: string;
  }[];
};

type Child = {
  id: string;
  name: string;
  assignedAdminId: string | null;
  photoPath: string;
  birthDay: string;
};

export default function AssignChildPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ admin: boolean; child: boolean }>({
    admin: false,
    child: false,
  });

  useEffect(() => {
    fetch("/api/admin/list")
      .then((res) => res.json())
      .then((data: Admin[]) => setAdmins(data))
      .catch((error) => console.error("Error fetching admins:", error));

    fetch("/api/child/list")
      .then((res) => res.json())
      .then((data: Child[]) => setChildren(data))
      .catch((error) => console.error("Error fetching children:", error));
    setIsLoading(false);
  }, []);

  // 학년 계산 함수
  const getGrade = (birthDay: string): string => {
    const birthYear = new Date(birthDay).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear + 1; // 한국 나이

    // 중학교: 13~15세 (1~3학년)
    if (age === 13) return "中学 1年";
    if (age === 14) return "中学 2年";
    if (age === 15) return "中学 3年";
    // 고등학교: 16~18세 (1~3학년)
    if (age === 16) return "高校 1年";
    if (age === 17) return "高校 2年";
    if (age === 18) return "高校 3年";

    return ""; // 중학교/고등학교 외 나이는 공백
  };

  const handleAssign = async () => {
    const newErrors = {
      admin: !selectedAdmin,
      child: !selectedChild,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setMessage("선생님과 아이를 모두 선택해주세요.");
      return;
    }
    setIsLoading(true);

    /** 한번 배정한 아이를 수정하지 못하게 하려면 아래의 코드를 활성화 할것 */
    // const selectedChildData = children.find(
    //   (child) => child.id === selectedChild
    // );
    // if (selectedChildData?.assignedAdminId) {
    //   setMessage("이미 배정된 아이입니다. 다른 아이를 선택해주세요.");
    //   setErrors({ ...errors, child: true });
    //   return;
    // }

    try {
      const res = await fetch("/api/superadmin/child/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChild,
          adminId: selectedAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("割り当て完了!");
        setSelectedAdmin("");
        setSelectedChild("");
        setErrors({ admin: false, child: false });
        const updatedChildren = await fetch("/api/child/list").then((res) =>
          res.json()
        );
        setChildren(updatedChildren);
        const updatedAdmins = await fetch("/api/admin/list").then((res) =>
          res.json()
        );
        setAdmins(updatedAdmins);
        setIsLoading(false);
      } else {
        setMessage(data.message || "割り当て失敗");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error assigning child:", error);
      setMessage("割り当てにエラーが発生しました");
      setIsLoading(false);
    }
  };

  const formatBirthDay = (birthDay: string) => {
    const date = new Date(birthDay);
    return `${date.getFullYear()}年 ${
      date.getMonth() + 1
    }月 ${date.getDate()}日`;
  };

  return (
    <div className="p-6">
      {isLoading && <Loading />}
      <h1 className="text-xl font-bold mb-4">クラス設定</h1>
      {message && (
        <div
          className={`mb-4 ${
            message.includes("完了") ? "text-green-600" : "text-red-500"
          }`}
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="mb-12 p-4 border rounded-lg shadow-sm bg-white">
        <div className="mb-4">
          <label
            htmlFor="admin"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            担当する先生<span className="text-red-500">*</span>
          </label>
          <select
            id="admin"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className={`border p-2 w-full ${
              errors.admin ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            required
          >
            <option value="" disabled>
              -- 先生選択 --
            </option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="child"
            className="block text-sm font-medium text-gray-700 mb-[10px]"
          >
            所属する学生<span className="text-red-500">*</span>
          </label>
          <select
            id="child"
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className={`border p-2 w-full ${
              errors.child ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            required
          >
            <option value="" disabled>
              -- 学生選択 --
            </option>
            {children.map((child) => (
              <option
                key={child.id}
                value={child.id}
                className={
                  child.assignedAdminId ? "text-gray-400" : "text-gray-800"
                }
              >
                {child.name}{" "}
                {getGrade(child.birthDay) && `(${getGrade(child.birthDay)})`}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAssign}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          割り当て
        </button>
      </div>

      <div className="mt-6">
        {/* 아직 배정되지 않은 학생 */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">未割り当ての学生</h2>
          {children.filter((c) => !c.assignedAdminId).length > 0 ? (
            <ul className="space-y-4">
              {children
                .filter((c) => !c.assignedAdminId)
                .map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg"
                  >
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
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {child.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        生年月日: {formatBirthDay(child.birthDay)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getGrade(child.birthDay) || "不明"}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              現在未割り当ての学生はいません。
            </p>
          )}
        </div>

        {admins.map((admin) => (
          <div key={admin.id} className="mt-8 mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              {admin.name} 先生
            </h3>
            {admin.assignedChildren.length > 0 ? (
              <ul className="space-y-4">
                {admin.assignedChildren.map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg"
                  >
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
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {child.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        生年月日: {formatBirthDay(child.birthDay)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ml-4 text-sm text-gray-500">
                割り当てられた学生はいません
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
