export type Child = {
  id: string;
  name: string;
  birthDay: string;
  photoPath: string;
  gender: "male" | "female";
  phone: string | null;
  lineId: string | null;
  grade: 1 | 2 | 3 | 4 | 5 | 6;
  cacaoTalkId: string | null;
  managerId: string;
  assignedAdminId: string | null;
  createdAt: Date;
};
