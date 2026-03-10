import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();

    // 2️⃣ 졸업 처리 + admin assignment 해제
    const result = await prisma.child.updateMany({
      where: {
        isGraduated: false,
      },
      data: {
        isGraduated: true,
        graduatedAt: today,
        assignedAdminId: null,
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
