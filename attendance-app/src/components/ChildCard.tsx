"use client";
import Image from "next/image";

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
  const age = currentYear - birthYear + 1;

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
  return (
    <div
      className={`border rounded p-4 flex items-center gap-4 ${
        checked ? "bg-green-300 border-green-700" : ""
      }`}
    >
      <Image
        width={500}
        height={500}
        src={child.photoPath || "/default_user.png"}
        alt={child.name}
        className="w-20 h-20 object-cover rounded"
        priority={highlight}
        sizes="80px"
      />
      <div className="flex-1">
        <p className="font-semibold">{child.name}</p>
        <p className="text-sm text-gray-600">{getGrade(child.birthDay)}</p>
      </div>
      {onCheck && onEdit && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onCheck(child.id)}
            className={`px-4 py-2 rounded text-white ${
              checked
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {checked ? "出席キャンセル" : "出席チェック"}
          </button>
          <button
            onClick={() => onEdit(child.id)}
            className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600"
          >
            修正
          </button>
        </div>
      )}
    </div>
  );
};
