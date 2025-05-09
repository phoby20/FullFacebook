import { ChildCard } from "./ChildCard";

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

export const ChildrenSection = ({
  title,
  childList,
  attendanceMap,
  onCheck,
  onEdit,
}: {
  title: string;
  childList: Child[];
  attendanceMap: Record<string, boolean>;
  onCheck?: (id: string) => void;
  onEdit?: (id: string) => void;
}) => {
  if (childList.length === 0) return null;

  return (
    <div className="mb-12 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:shadow-2xl">
      {title && (
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
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
