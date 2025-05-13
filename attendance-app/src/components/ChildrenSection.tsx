import { Child } from "@/type/child";
import { ChildCard } from "./ChildCard";
import Image from "next/image";

export const ChildrenSection = ({
  title,
  childList,
  attendanceMap,
  userPhotoPath,
  onCheck,
  onEdit,
}: {
  title: string;
  userPhotoPath: string | undefined;
  childList: Child[];
  attendanceMap: Record<string, boolean>;
  onCheck?: (id: string) => void;
  onEdit?: (id: string) => void;
}) => {
  if (childList.length === 0) return null;

  return (
    <div className="mb-12 p-3 pb-6 pt-6 bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:shadow-xl">
      {title && (
        <div className="flex items-center mb-4 gap-x-3 pl-4 ">
          <Image
            width={40}
            height={40}
            src={userPhotoPath || "/default_user.png"}
            alt={userPhotoPath ?? ""}
            className="w-12 h-12 object-cover rounded-full border-2 border-fuchsia-400"
            sizes="80px"
          />
          <h2 className="font-semibold text-gray-800">{title}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {childList.map((child, i) => (
          <ChildCard
            key={child.id}
            child={child}
            checked={attendanceMap[child.id]}
            onCheck={onCheck}
            onEdit={onEdit}
            highlight={i === 0}
          />
        ))}
      </div>
    </div>
  );
};
