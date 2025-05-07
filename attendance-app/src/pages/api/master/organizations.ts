// 단체 목록 조회

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
      const organizations = await prisma.organization.findMany({
        select: { id: true, name: true },
      });
      res.status(200).json(organizations);
    } catch (error) {
      console.error("단체 조회 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else if (req.method === "POST") {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "단체 이름 필요" });
    }
    try {
      const organization = await prisma.organization.create({
        data: {
          name,
          groups: { create: { name: "기본 그룹" } }, // 단체는 최소 1개 그룹 필요
        },
      });
      res.status(201).json(organization);
    } catch (error) {
      console.error("단체 생성 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
