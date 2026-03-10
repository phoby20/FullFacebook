import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await prisma.child.updateMany({
      where: {
        isGraduated: true,
        graduatedAt: {
          lte: oneYearAgo,
        },
      },
      data: {
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      archived: result.count,
    });
  } catch (error) {
    console.error("Archive graduates cron failed:", error);

    return NextResponse.json(
      { error: "Archive graduates job failed" },
      { status: 500 },
    );
  }
}
