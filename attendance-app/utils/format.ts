import { Child } from "@/types/child";

export const formatBirthDay = (birthDay: string) => {
  const date = new Date(birthDay);
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
};

export function getGrade(grade: Child["grade"]): string {
  switch (grade) {
    case 1:
      return "中学1年";
    case 2:
      return "中学2年";
    case 3:
      return "中学3年";
    case 4:
      return "高校1年";
    case 5:
      return "高校2年";
    case 6:
      return "高校3年";
    default:
      return "";
  }
}
