import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, password, birthDay, gender, role } = req.body;

  // 입력값 유효성 검사
  if (!name || !email || !password || !birthDay || !gender || !role) {
    return res.status(400).json({ message: "全ての項目を入力してください" });
  }

  // birthDay 형식 검사 (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDay)) {
    return res
      .status(400)
      .json({ message: "生年月日は YYYY-MM-DD 形式にしてください" });
  }

  // 이메일 중복 확인
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(400).json({ message: "すでに存在するEmailです" });

  const hashed = bcrypt.hashSync(password, 10);

  try {
    let organizationId: string | null = null;
    let groupId: string | null = null;

    // superAdmin으로 등록 시 단체와 그룹 자동 지정
    if (role === "admin") {
      const token = req.cookies.token;
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          if (decoded.role === "superAdmin") {
            // superAdmin의 소속 단체 조회
            const superAdmin = await prisma.user.findUnique({
              where: { id: decoded.userId },
              include: { organizations: { select: { organization: true } } },
            });
            if (!superAdmin || superAdmin.organizations.length === 0) {
              return res
                .status(400)
                .json({
                  message: "superAdminは必ず団体に所属する必要があります",
                });
            }
            organizationId = superAdmin.organizations[0].organization.id;

            // 단체 내 기본 그룹 조회 또는 생성
            let group = await prisma.group.findFirst({
              where: { organizationId },
            });
            if (!group) {
              group = await prisma.group.create({
                data: {
                  name: "default group",
                  organizationId,
                },
              });
            }
            groupId = group.id;
          }
        } catch {
          // 토큰 오류는 무시하고 기본 동작 수행
        }
      }
    }

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        birthDay: new Date(birthDay),
        gender,
        role,
        ...(organizationId && {
          organizations: {
            create: { organizationId },
          },
        }),
        ...(groupId && {
          groups: {
            create: { groupId },
          },
        }),
      },
    });

    res.status(200).json({ message: "先生追加成功", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "先生追加にエラーが発生しました" });
  }
}
