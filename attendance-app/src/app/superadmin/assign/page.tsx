"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Loading from "@/components/Loading";
import { formatBirthDay, getGrade } from "../../../../utils/format";

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
    Promise.all([
      fetch("/api/admin/list").then((res) => res.json()),
      fetch("/api/child/list").then((res) => res.json()),
    ])
      .then(([adminData, childData]) => {
        setAdmins(adminData);
        setChildren(childData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setMessage("データの取得中にエラーが発生しました");
        setIsLoading(false);
      });
  }, []);

  const handleAssign = async () => {
    const newErrors = {
      admin: !selectedAdmin,
      child: !selectedChild,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      setMessage("選先生と学生を両方選択してください。");
      return;
    }
    setIsLoading(true);

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
        const [updatedAdmins, updatedChildren] = await Promise.all([
          fetch("/api/admin/list").then((res) => res.json()),
          fetch("/api/child/list").then((res) => res.json()),
        ]);
        setAdmins(updatedAdmins);
        setChildren(updatedChildren);
      } else {
        setMessage(data.message || "割り当て失敗");
      }
    } catch (error) {
      console.error("Error assigning child:", error);
      setMessage("割り当てにエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {isLoading && <Loading message="データを読み込んでいます..." />}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          クラス設定
        </h1>

        {message && (
          <div
            className={`mb-8 p-4 rounded-lg shadow-md animate-fade-in ${
              message.includes("完了")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            aria-live="polite"
            id="form-message"
          >
            {message}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-xl mb-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAssign();
            }}
            aria-describedby="form-message"
          >
            <div className="mb-6">
              <label
                htmlFor="admin"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                担当する先生<span className="text-red-500">*</span>
              </label>
              <select
                id="admin"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                  errors.admin ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={errors.admin}
                aria-describedby="admin-error form-message"
              >
                <option value="" disabled>
                  -- 先生を選択 --
                </option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="child"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                所属する学生<span className="text-red-500">*</span>
              </label>
              <select
                id="child"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                  errors.child ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={errors.child}
                aria-describedby="child-error form-message"
              >
                <option value="" disabled>
                  -- 学生を選択 --
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
                    {getGrade(child.birthDay) &&
                      `(${getGrade(child.birthDay)})`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="割り当てボタン"
            >
              {isLoading ? "割り当て中..." : "割り当て"}
            </button>
          </form>
        </div>

        <div className="space-y-12">
          {/* 未割り当ての学生 */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              未割り当ての学生
            </h2>
            {children.filter((c) => !c.assignedAdminId).length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {children
                  .filter((c) => !c.assignedAdminId)
                  .map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      {child.photoPath ? (
                        <Image
                          width={48}
                          height={48}
                          src={child.photoPath}
                          alt={`${child.name}の写真`}
                          className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          width={48}
                          height={48}
                          src="/default_user.png"
                          alt="基本画像"
                          className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                          loading="lazy"
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

          {/* 先生ごとの割り当て学生 */}
          {admins.map((admin) => (
            <div key={admin.id}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {admin.name} 先生
              </h3>
              {admin.assignedChildren.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {admin.assignedChildren.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      {child.photoPath ? (
                        <Image
                          width={48}
                          height={48}
                          src={child.photoPath}
                          alt={`${child.name}の写真`}
                          className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          width={48}
                          height={48}
                          src="/default_user.png"
                          alt="基本画像"
                          className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                          loading="lazy"
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
                  割り当てられた学生はいません
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
