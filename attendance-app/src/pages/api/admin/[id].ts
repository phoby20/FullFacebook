// src/pages/api/user/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      select: { name: true },
    });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
}
