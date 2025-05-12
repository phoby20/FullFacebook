import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getTokenUser } from "../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { childId } = req.body;
    const tokenUser = await getTokenUser(req);

    if (!tokenUser)
      return res.status(401).json({ message: "ログインしてください" });

    const today = new Date();

    // UTC+9 보정 시간 생성
    const jstTime = new Date(today.getTime() + 9 * 60 * 60 * 1000); // UTC + 9시간
    console.log("jestTime", jstTime);

    const existing = await prisma.attendance.findFirst({
      where: {
        childId,
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "すでに出席処理済みです" });
    }

    await prisma.attendance.create({
      data: {
        date: jstTime,
        child: {
          connect: { id: childId },
        },
        checkedBy: {
          connect: { id: tokenUser.userId },
        },
      },
    });

    res.status(200).json({ message: "出席チェック完了!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: `サーバーエラー: ${err}` });
  }
}
