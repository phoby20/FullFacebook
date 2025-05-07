import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../../lib/prisma";
import { getTokenUser } from "../../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const tokenUser = await getTokenUser(req);
  if (!tokenUser || tokenUser.role !== "superAdmin") {
    return res.status(403).json({ message: "Access Denied" });
  }

  const { adminId, childId } = req.body;

  if (!adminId || !childId) {
    return res.status(400).json({ message: "adminId와 childId가 필요합니다." });
  }

  try {
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        assignedAdmin: {
          connect: { id: adminId },
        },
      },
    });

    return res.status(200).json({ message: "배정 완료", updatedChild });
  } catch (error) {
    console.error("배정 오류:", error);
    return res.status(500).json({ message: "서버 오류" });
  }
}
