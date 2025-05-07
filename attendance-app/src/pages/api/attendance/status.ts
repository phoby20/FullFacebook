// 예시: /api/attendance/status.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { childId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  if (!childId || typeof childId !== "string") {
    return res.status(400).json({ message: "잘못된 childId" });
  }

  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));

  const existing = await prisma.attendance.findFirst({
    where: {
      childId,
      date: {
        gte: start,
        lt: end,
      },
    },
  });

  res.status(200).json({ checked: !!existing });
}
