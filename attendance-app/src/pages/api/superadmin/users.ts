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
    if (decoded.role !== "superAdmin") {
      return res.status(403).json({ message: "superAdmin 권한 필요" });
    }
  } catch {
    return res.status(401).json({ message: "유효하지 않은 토큰" });
  }

  if (req.method === "GET") {
    try {
      // superAdmin의 소속 단체 조회
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organizations: { select: { organization: true } } },
      });
      if (!user || user.organizations.length === 0) {
        return res.status(400).json({ message: "소속 단체가 없습니다." });
      }
      const organizationId = user.organizations[0].organization.id;

      // 단체 내 admin, child 사용자 조회
      const users = await prisma.user.findMany({
        where: {
          role: { in: ["admin", "child"] },
          organizations: { some: { organizationId } },
        },
        include: {
          groups: {
            select: { group: { select: { id: true, name: true } } },
          },
        },
      });
      res.status(200).json(users);
    } catch (error) {
      console.error("사용자 조회 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
