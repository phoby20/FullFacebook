import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../../lib/prisma";
import { getTokenUser } from "../../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const tokenUser = await getTokenUser(req);
  if (!tokenUser || tokenUser.role !== "superAdmin") {
    return res.status(403).json({ message: "Access Denied" });
  }

  const { adminId, childIds, childId } = req.body;

  const ids: string[] = childIds || (childId ? [childId] : []);

  if (ids.length === 0) {
    return res.status(400).json({ message: "childIdsが必要です。" });
  }

  try {
    const updates = await prisma.$transaction(
      ids.map((id) =>
        prisma.child.update({
          where: { id },
          data: adminId
            ? {
                assignedAdmin: {
                  connect: { id: adminId },
                },
              }
            : {
                assignedAdmin: {
                  disconnect: true,
                },
              },
        }),
      ),
    );

    return res
      .status(200)
      .json({ message: "배정 완료", count: updates.length });
  } catch (error) {
    console.error("배정 오류:", error);
    return res.status(500).json({ message: "서버 오류" });
  }
}
