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

  // 일본 도쿄 시각 (UTC+9) 기준으로 오늘의 00:00 ~ 23:59:59
  const now = new Date();

  // UTC+9 보정 시간 생성
  const utc = now.getTime() + now.getTimezoneOffset() * 60000; // 현재 UTC 시간
  const jstTime = new Date(utc + 9 * 60 * 60 * 1000); // UTC + 9시간

  const year = jstTime.getFullYear();
  const month = jstTime.getMonth();
  const date = jstTime.getDate();

  const start = new Date(Date.UTC(year, month, date, 0, 0, 0)); // JST 자정
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999)); // JST 23:59:59

  console.log("Japan time range:", start.toISOString(), end.toISOString());

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
