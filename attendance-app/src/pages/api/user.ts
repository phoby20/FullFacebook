// src/pages/api/user.ts
import { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

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
    // 사용자 추가
    const {
      name,
      email,
      password,
      birthDay,
      gender,
      role,
      organizationId,
      groupId,
      photoPath,
      phone,
      lineId,
      cacaoTalkId,
    } = req.body;

    if (!name || !email || !password || !birthDay || !gender || !role) {
      return res.status(400).json({ message: "필수 필드 누락" });
    }

    // superAdmin, admin, child는 organizationId와 groupId 필수
    if (
      ["superAdmin", "admin", "child"].includes(role) &&
      (!organizationId || !groupId)
    ) {
      return res.status(400).json({ message: "단체와 그룹 소속 필수" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          birthDay: new Date(birthDay),
          gender,
          role,
          photoPath,
          phone,
          lineId,
          cacaoTalkId,
          organizations: organizationId
            ? { create: { organizationId } }
            : undefined,
          groups: groupId ? { create: { groupId } } : undefined,
        },
      });
      res.status(201).json({ message: "사용자 생성 완료", user });
    } catch (error) {
      console.error("사용자 생성 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else if (req.method === "DELETE") {
    // 사용자 삭제
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "사용자 ID 필요" });
    }
    try {
      await prisma.user.delete({
        where: { id },
      });
      res.status(200).json({ message: "사용자 삭제 완료" });
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      res.status(500).json({ message: "서버 오류" });
    }
  } else {
    res.status(405).json({ message: "허용되지 않은 메서드" });
  }
}
