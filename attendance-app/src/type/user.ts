export type User = {
  id: string;
  name: string;
  role: "master" | "superAdmin" | "admin" | "child";
  photoPath?: string;
};
