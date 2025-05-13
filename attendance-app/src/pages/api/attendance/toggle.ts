import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getTokenUser } from "../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { childId, date, action } = req.body;
    console.log("Received request:", { childId, date, action });

    const tokenUser = await getTokenUser(req);
    if (!tokenUser) {
      return res.status(401).json({ message: "ログインしてください" });
    }

    if (
      !childId ||
      !date ||
      !action ||
      !["check", "uncheck"].includes(action)
    ) {
      return res.status(400).json({
        message:
          "childId, date, action은 필수이며, action은 'check' 또는 'uncheck'이어야 합니다",
      });
    }

    const targetDate = new Date(date + "T00:00:00Z");
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: "유효하지 않은 날짜 형식입니다" });
    }

    const start = new Date(date + "T00:00:00+09:00"); // KST 기준
    const end = new Date(date + "T23:59:59.999+09:00");
    console.log("Parsed date:", { targetDate, start, end });

    const existing = await prisma.attendance.findFirst({
      where: {
        childId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });
    console.log("Existing attendance:", existing);

    if (action === "check") {
      if (existing) {
        return res.status(400).json({ message: "すでに出席処理済みです" });
      }

      const attendance = await prisma.attendance.create({
        data: {
          date: new Date(date + "T00:00:00Z"), // UTC 저장
          child: { connect: { id: childId } },
          checkedBy: { connect: { id: tokenUser.userId } },
        },
      });

      return res.status(200).json({
        message: "出席チェック完了!",
        attendance: {
          id: attendance.id,
          date: attendance.date.toISOString(),
          checkedById: attendance.checkedById,
        },
      });
    } else {
      if (!existing) {
        return res.status(404).json({ message: "出席記録がありません" });
      }

      console.log("Deleting attendance record:", existing.id);
      await prisma.$transaction(async (tx) => {
        await tx.attendance.delete({
          where: { id: existing.id },
        });
      });
      console.log(
        "Deleted attendance record for childId:",
        childId,
        "date:",
        date
      );

      return res.status(200).json({ message: "出席がキャンセルされました" });
    }
  } catch (err) {
    console.error("Error in /api/attendance/toggle:", err);
    return res.status(500).json({ message: `サーバーエラー: ${err}` });
  }
}
