export const formatBirthDay = (birthDay: string) => {
  const date = new Date(birthDay);
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
};

export function getGrade(birthDay: string): string {
  const birthDate = new Date(birthDay);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDayOfMonth = birthDate.getDate();

  // 일본 학년 기준: 4월 1일 이전 출생자는 같은 해, 4월 2일 이후는 다음 해 입학 cohort
  let cohortYear = birthYear;
  if (birthMonth > 3 || (birthMonth === 3 && birthDayOfMonth >= 2)) {
    cohortYear = birthYear + 1;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 일본 학년도: 4월 시작 (3월까지는 이전 학년도)
  const fiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  // 중학교 계산 (중1 시작: cohortYear + 12)
  const middleGrade = fiscalYear - (cohortYear + 12) + 1;
  if (middleGrade >= 1 && middleGrade <= 3) {
    return `中学 ${middleGrade}年`;
  }

  // 고등학교 계산 (고1 시작: cohortYear + 15)
  const highGrade = fiscalYear - (cohortYear + 15) + 1;
  if (highGrade >= 1 && highGrade <= 3) {
    return `高校 ${highGrade}年`;
  }

  return "";
}
