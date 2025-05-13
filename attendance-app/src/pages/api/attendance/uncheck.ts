// 출석 기록 삭제 (취소)
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getTokenUser } from "../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { childId } = req.body;
  const tokenUser = await getTokenUser(req);
  if (!tokenUser)
    return res.status(401).json({ message: "ログインしてください" });

  const today = new Date();
  // UTC+9 보정 시간 생성
  const jstTime = new Date(today.getTime() + 9 * 60 * 60 * 1000); // UTC + 9시간
  console.log("jestTime", jstTime);

  const start = new Date(jstTime.setHours(0, 0, 0, 0));
  const end = new Date(jstTime.setHours(23, 59, 59, 999));

  const deleted = await prisma.attendance.deleteMany({
    where: {
      childId,
      date: { gte: start, lt: end },
    },
  });

  res.status(200).json({
    message: deleted.count > 0 ? "出席がキャンセルされました" : "記録なし",
  });
}
