// 단체 지정

import { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import { prisma } from "../../../../lib/prisma";

type DecodedToken = {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "인증되지 않음" });
  }

  let decoded: DecodedToken;
  try {
    decoded = jwtDecode(token);
    if (decoded.role !== "master") {
      return res.status(403).json({ message: "master 권한 필요" });
    }
  } catch {
    return res.status(401).json({ message: "유효하지 않은 토큰" });
  }

  if (req.method === "POST") {
    const { userId, organizationId } = req.body;
    if (!userId || !organizationId) {
      return res.status(400).json({ message: "사용자 ID와 단체 ID 필요" });
    }

    try {
      // 기존 단체 소속 삭제 (단일 단체 소속 가정)
      await prisma.userOrganization.deleteMany({
        where: { userId },
      });

      // 새 단체 소속 추가
      await prisma.userOrganization.create({
        data: {
          userId,
          organizationId,
        },
      });

      res.status(200).json({ message: "단체 지정 완료" });
    } catch (error) {
      console.error("단체 지정 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
