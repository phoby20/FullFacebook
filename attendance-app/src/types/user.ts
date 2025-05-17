export type User = {
  id: string;
  name: string;
  birthDay: string;
  role: "master" | "superAdmin" | "admin" | "child";
  photoPath?: string;
};
