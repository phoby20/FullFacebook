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

  if (req.method === "POST") {
    const { userId, groupId } = req.body;
    if (!userId || !groupId) {
      return res.status(400).json({ message: "사용자 ID와 그룹 ID 필요" });
    }

    try {
      // superAdmin의 소속 단체 확인
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organizations: { select: { organization: true } } },
      });
      if (!user || user.organizations.length === 0) {
        return res.status(400).json({ message: "소속 단체가 없습니다." });
      }
      const organizationId = user.organizations[0].organization.id;

      // 그룹이 단체에 속하는지 확인
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });
      if (!group || group.organizationId !== organizationId) {
        return res.status(400).json({ message: "유효하지 않은 그룹" });
      }

      // 기존 그룹 소속 삭제 (단일 그룹 소속 가정)
      await prisma.userGroup.deleteMany({
        where: { userId },
      });

      // 새 그룹 소속 추가
      await prisma.userGroup.create({
        data: {
          userId,
          groupId,
        },
      });

      res.status(200).json({ message: "그룹 지정 완료" });
    } catch (error) {
      console.error("그룹 지정 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
