// pages/api/duty-assignments/bulk-delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getTokenUser } from "../../../../utils/auth";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getTokenUser(req);
  if (!user || user.role === "child") {
    return res.status(403).json({ message: "権限がありません。" });
  }

  if (req.method === "POST") {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "삭제할 당번 지정 ID 목록을 제공해주세요.",
      });
    }

    try {
      const deletedCount = await prisma.dutyAssignment.deleteMany({
        where: {
          id: { in: ids },
          assignedById: user.userId, // 보안: 로그인한 사용자가 지정한 항목만 삭제
        },
      });

      if (deletedCount.count === 0) {
        return res.status(404).json({
          message: "삭제할 당번 지정이 존재하지 않거나 권한이 없습니다.",
        });
      }

      return res.status(200).json({
        message: `${deletedCount.count}개의 당번 지정이 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("Error deleting assignments:", error);
      return res.status(500).json({
        message: `당번 지정 삭제에 실패했습니다. ${error}`,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }
}
