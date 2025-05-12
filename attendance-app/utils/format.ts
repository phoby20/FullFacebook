export const formatBirthDay = (birthDay: string) => {
  const date = new Date(birthDay);
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
};

export function getGrade(birthDay: string): string {
  const birthDate = new Date(birthDay);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth(); // 0 = January, 3 = April

  // 1~3월 출생자는 학년을 한 해 앞당기기 위해 연도에서 -1
  const schoolStartYear = birthMonth < 3 ? birthYear - 1 : birthYear;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 나이 기준이 아닌 입학년도 기준으로 중1~고3을 판단
  const grade = currentYear - schoolStartYear;

  if (grade === 13) return "中学 1年";
  if (grade === 14) return "中学 2年";
  if (grade === 15) return "中学 3年";
  if (grade === 16) return "高校 1年";
  if (grade === 17) return "高校 2年";
  if (grade === 18) return "高校 3年";
  return "";
}
