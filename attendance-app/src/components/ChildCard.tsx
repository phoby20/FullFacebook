"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { formatBirthDay, getGrade } from "../../utils/format";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div
      className={`p-2 px-3 bg-white rounded-xl shadow-md border border-gray-100 transform transition-all hover:scale-105 hover:shadow-xl ${
        checked ? "border-green-400 border-3" : ""
      }`}
    >
      <div className="flex justify-end items-center">
        {/* {checked ? (
          <span className="text-green-500 text-2xl font-bold">✓</span>
        ) : (
          <span className="text-gray-300 text-2xl">●</span>
        )} */}
      </div>
      <div className="flex items-center gap-4">
        <Image
          width={80}
          height={80}
          src={child.photoPath || "/default_user.png"}
          alt={child.name}
          className={`w-24 h-24 object-cover rounded-full border-2 border-gray-200" ${
            checked ? "border-4 border-green-500" : ""
          }`}
          priority={highlight}
          sizes="80px"
        />
        <div className="flex-1">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-800 font-semibold">
                {child.name}
              </p>
              <div className="relative" ref={dropdownRef}>
                {onCheck && (
                  <button
                    className="text-l cursor-pointer text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                    onClick={toggleDropdown}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                    aria-label="オプションを開く"
                  >
                    ⁝
                  </button>
                )}
                {isDropdownOpen && onEdit && (
                  <div className="absolute cursor-pointer right-0 mt-2 w-26 bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fade-in">
                    <button
                      onClick={() => {
                        onEdit(child.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      aria-label="学生情報を修正"
                    >
                      修正
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {getGrade(child.birthDay)}（{formatBirthDay(child.birthDay)}）
            </p>
          </div>
          {onCheck && (
            <button
              onClick={() => onCheck(child.id)}
              className={`cursor-pointer w-30 py-2 px-3 rounded-lg font-semibold transition-all duration-300 border-2 ${
                checked
                  ? "border-red-500 text-red-500 hover:border-red-600 hover:text-red-600 focus:ring-red-500"
                  : "border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600 focus:ring-blue-500"
              } bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-2`}
              aria-label={checked ? "キャンセル" : "出席"}
            >
              {checked ? "キャンセル" : "出席"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
