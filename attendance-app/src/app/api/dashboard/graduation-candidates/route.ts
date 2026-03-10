import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET() {
  const today = new Date();

  // Show modal only between Feb 1 and Mar 31
  const start = new Date(today.getFullYear(), 1, 1);
  const end = new Date(today.getFullYear(), 2, 31);

  if (today < start || today > end) {
    return NextResponse.json([]);
  }

  const high3Students = await prisma.child.findMany({
    where: {
      isGraduated: false,
      grade: 6, // 高校3年
    },
    select: {
      id: true,
      name: true,
      birthDay: true,
      photoPath: true,
      grade: true,
    },
  });

  return NextResponse.json(high3Students);
}
