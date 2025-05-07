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
    <div className="mt-10 mb-10 p-2 pb-8 rounded-lg border border-gray-300 shadow-lg ">
      <h2 className="mt-8 pl-5 text-xl font-semibold mb-3">{title}</h2>
      <div className="grid gap-4">
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
