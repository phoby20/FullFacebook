import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getGrade } from "../../../../../utils/format";

export async function GET() {
  const today = new Date();

  // Show modal only between Feb 1 and Mar 31
  const start = new Date(today.getFullYear(), 1, 1);
  const end = new Date(today.getFullYear(), 2, 31);

  if (today < start || today > end) {
    return NextResponse.json([]);
  }

  const students = await prisma.child.findMany({
    where: {
      isGraduated: false,
    },
    select: {
      id: true,
      name: true,
      birthDay: true,
      photoPath: true,
    },
  });

  const high3Students = students.filter((student) => {
    const birth =
      student.birthDay instanceof Date
        ? student.birthDay.toISOString()
        : String(student.birthDay);

    return getGrade(birth) === "高校 3年";
  });

  return NextResponse.json(high3Students);
}
