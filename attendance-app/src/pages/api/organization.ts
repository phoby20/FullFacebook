// src/pages/api/organization.ts
import { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import { prisma } from "../../../lib/prisma";

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
    // 단체 추가
    const { name, groupName } = req.body;
    if (!name || !groupName) {
      return res
        .status(400)
        .json({ message: "단체 이름과 초기 그룹 이름 필요" });
    }
    try {
      const organization = await prisma.organization.create({
        data: {
          name,
          groups: {
            create: { name: groupName },
          },
        },
      });
      res.status(201).json(organization);
    } catch (error) {
      console.error("단체 추가 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else if (req.method === "DELETE") {
    // 단체 삭제
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "단체 ID 필요" });
    }
    try {
      // 단체에 그룹이 있는지 확인
      const groupCount = await prisma.group.count({
        where: { organizationId: id },
      });
      if (groupCount === 0) {
        return res
          .status(400)
          .json({ message: "단체에는 최소 하나 이상의 그룹이 있어야 함" });
      }
      await prisma.organization.delete({
        where: { id },
      });
      res.status(200).json({ message: "단체 삭제 완료" });
    } catch (error) {
      console.error("단체 삭제 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
