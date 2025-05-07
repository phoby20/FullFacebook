// master가 superAdmin에게 단체를 지정하기 위한 API

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

  if (req.method === "GET") {
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: "superAdmin" },
        include: {
          organizations: {
            select: { organization: { select: { id: true, name: true } } },
          },
        },
      });
      res.status(200).json(superAdmins);
    } catch (error) {
      console.error("superAdmin 조회 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
