import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../../lib/prisma";
import { getTokenUser } from "../../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const tokenUser = await getTokenUser(req);
  if (!tokenUser || tokenUser.role !== "superAdmin") {
    return res.status(403).json({ message: "Access Denied" });
  }

  const { adminId, childIds, childId } = req.body;

  // DELETE: 특정 선생-학생 배정 해제
  if (req.method === "DELETE") {
    if (!adminId || !childId) {
      return res.status(400).json({ message: "adminIdとchildIdが必要です。" });
    }
    try {
      await prisma.childAdminAssignment.delete({
        where: { childId_adminId: { childId, adminId } },
      });
      return res.status(200).json({ message: "削除完了" });
    } catch (error) {
      console.error("배정 해제 오류:", error);
      return res.status(500).json({ message: "서버 오류" });
    }
  }

  const ids: string[] = childIds || (childId ? [childId] : []);

  if (ids.length === 0) {
    return res.status(400).json({ message: "childIdsが必要です。" });
  }

  try {
    if (adminId) {
      // 선생 배정: 중복 방지를 위해 upsert 사용
      await prisma.$transaction(
        ids.map((id) =>
          prisma.childAdminAssignment.upsert({
            where: { childId_adminId: { childId: id, adminId } },
            create: { childId: id, adminId },
            update: {},
          })
        )
      );
    } else {
      // 배정 해제: 해당 학생의 모든 선생 배정 제거
      await prisma.childAdminAssignment.deleteMany({
        where: { childId: { in: ids } },
      });
    }

    return res.status(200).json({ message: "배정 완료", count: ids.length });
  } catch (error) {
    console.error("배정 오류:", error);
    return res.status(500).json({ message: "서버 오류" });
  }
}
