import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET() {
  try {
    const result = await prisma.child.updateMany({
      where: {
        isGraduated: false,
        grade: {
          lt: 6, // 고3은 승급하지 않음
        },
      },
      data: {
        grade: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      promotedCount: result.count,
    });
  } catch (error) {
    console.error("Grade promotion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Grade promotion failed",
      },
      { status: 500 },
    );
  }
}
