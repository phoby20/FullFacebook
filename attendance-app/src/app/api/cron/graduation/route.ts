import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();

    // 고등학교 3학년(grade 6) 학생만 졸업 처리 + admin assignment 해제
    const graduating = await prisma.child.findMany({
      where: { isGraduated: false, grade: 6 },
      select: { id: true },
    });
    const graduatingIds = graduating.map((c) => c.id);

    await prisma.childAdminAssignment.deleteMany({
      where: { childId: { in: graduatingIds } },
    });

    const result = await prisma.child.updateMany({
      where: {
        isGraduated: false,
        grade: 6,
      },
      data: {
        isGraduated: true,
        graduatedAt: today,
      },
    });

    return NextResponse.json({
      success: true,
      processed: result.count,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Graduation job failed" },
      { status: 500 },
    );
  }
}
