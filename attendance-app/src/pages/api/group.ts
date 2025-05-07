// src/pages/api/group.ts
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
    // 그룹 추가
    const { name, organizationId } = req.body;
    if (!name || !organizationId) {
      return res.status(400).json({ message: "그룹 이름과 단체 ID 필요" });
    }
    try {
      const group = await prisma.group.create({
        data: { name, organizationId },
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("그룹 추가 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else if (req.method === "DELETE") {
    // 그룹 삭제
    const { id, organizationId } = req.body;
    if (!id || !organizationId) {
      return res.status(400).json({ message: "그룹 ID와 단체 ID 필요" });
    }
    try {
      // 단체에 그룹이 하나만 남았는지 확인
      const groupCount = await prisma.group.count({
        where: { organizationId },
      });
      if (groupCount <= 1) {
        return res
          .status(400)
          .json({ message: "단체에는 최소 하나 이상의 그룹이 있어야 함" });
      }
      await prisma.group.delete({
        where: { id },
      });
      res.status(200).json({ message: "그룹 삭제 완료" });
    } catch (error) {
      console.error("그룹 삭제 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
