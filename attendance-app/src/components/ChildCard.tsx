"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

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

function getGrade(birthDay: string): string {
  const birthYear = new Date(birthDay).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age === 13) return "中学 1年";
  if (age === 14) return "中学 2年";
  if (age === 15) return "中学 3年";
  if (age === 16) return "高校 1年";
  if (age === 17) return "高校 2年";
  if (age === 18) return "高校 3年";
  return "";
}

export const ChildCard = ({
  child,
  checked,
  onCheck,
  onEdit,
  highlight = false,
}: {
  child: Child;
  checked: boolean;
  onCheck?: (id: string) => void;
  onEdit?: (id: string) => void;
  highlight?: boolean;
}) => {
  // 드롭다운 메뉴의 표시 여부를 관리하는 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 드롭다운 토글 함수
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div
      className={`rounded p-4 border border-gray-200 ${
        checked ? "border-green-500 border-1" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        {checked ? (
          <p className="text-green-500 font-extrabold">●</p>
        ) : (
          <p className="text-gray-300">●</p>
        )}
        {/* 드롭다운 메뉴를 포함한 컨테이너 */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={toggleDropdown}
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            more
          </button>
          {isDropdownOpen && onEdit && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit(child.id);
                  setIsDropdownOpen(false); // 수정 클릭 시 드롭다운 닫기
                }}
                className="w-full px-4 py-2 text-left text-white bg-gray-500 hover:bg-gray-600 rounded"
              >
                修正
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Image
          width={500}
          height={500}
          src={child.photoPath || "/default_user.png"}
          alt={child.name}
          className="w-30 h-30 object-cover rounded"
          priority={highlight}
          sizes="80px"
        />
        <div className="flex-1">
          <div className="mb-6">
            <p className="font-semibold">{child.name}</p>
            <p className="text-sm text-gray-600">{getGrade(child.birthDay)}</p>
          </div>
          {onCheck && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onCheck(child.id)}
                className={`w-35 px-4 py-2 rounded text-white ${
                  checked
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {checked ? "出席キャンセル" : "出席チェック"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
