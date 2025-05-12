import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { jwtDecode } from "jwt-decode";
import { IncomingForm, Files, Fields } from "formidable";
import { resizeAndSave } from "../../../../lib/resizeImage";
import sharp from "sharp";

// Gender enum 정의 (Prisma 스키마와 일치)
type Gender = "male" | "female";
type Role = "master" | "superAdmin" | "admin" | "child";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface DecodedToken {
  userId: string;
  role: "master" | "superAdmin" | "admin" | "child";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "허용되지 않은 메서드입니다" });
  }

  const form = new IncomingForm({
    multiples: false,
    uploadDir: "./public/uploads",
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    filter: ({ mimetype }) => !!mimetype && mimetype.startsWith("image/"),
  });

  try {
    const { fields, files }: { fields: Fields; files: Files } =
      await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("Formidable parse error:", err);
            reject(err);
          }
          resolve({ fields, files });
        });
      });

    // 필드 추출
    const name = Array.isArray(fields.name)
      ? fields.name[0]
      : fields.name || "";
    const email = Array.isArray(fields.email)
      ? fields.email[0]
      : fields.email || "";
    const password = Array.isArray(fields.password)
      ? fields.password[0]
      : fields.password || "";
    const birthDay = Array.isArray(fields.birthDay)
      ? fields.birthDay[0]
      : fields.birthDay || "";
    const gender = Array.isArray(fields.gender)
      ? fields.gender[0]
      : fields.gender || "";
    const role = Array.isArray(fields.role)
      ? fields.role[0]
      : fields.role || "";
    const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;

    console.log("Received request:", {
      name,
      email,
      password,
      birthDay,
      gender,
      role,
      photo: file,
    });

    // 입력값 유효성 검사
    if (!name || !email || !password || !birthDay || !gender || !role) {
      return res.status(400).json({ message: "全ての項目を入力してください" });
    }

    // birthDay 형식 검사
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDay)) {
      return res
        .status(400)
        .json({ message: "生年月日は YYYY-MM-DD 形式にしてください" });
    }

    // gender 검증
    const validGenders: Gender[] = ["male", "female"];
    if (!validGenders.includes(gender as Gender)) {
      return res
        .status(400)
        .json({
          message: "유효하지 않은 성별입니다. male 또는 female을 입력하세요",
        });
    }

    // role 검증
    const validRoles = ["master", "superAdmin", "admin", "child"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "유효하지 않은 역할입니다" });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "이메일 형식이 올바르지 않습니다" });
    }

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "すでに存在するEmailです" });
    }

    // 비밀번호 해싱
    const hashed = bcrypt.hashSync(password, 10);

    // 사진 처리
    let photoPath = "";
    if (file && file.filepath) {
      try {
        const buffer = await sharp(file.filepath)
          .rotate()
          .withMetadata({ orientation: undefined })
          .toBuffer();
        const filename = `${Date.now()}-${
          file.originalFilename || "image.jpg"
        }`;
        photoPath = await resizeAndSave(buffer, filename);
      } catch (error) {
        console.error("이미지 처리 오류:", error);
        return res
          .status(500)
          .json({ message: "이미지 처리 중 오류가 발생했습니다" });
      }
    }

    let organizationId: string | null = null;
    let groupId: string | null = null;

    if (role === "admin") {
      const token = req.cookies.token;
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          if (decoded.role === "superAdmin") {
            const superAdmin = await prisma.user.findUnique({
              where: { id: decoded.userId },
              include: { organizations: { select: { organization: true } } },
            });
            if (!superAdmin || superAdmin.organizations.length === 0) {
              return res.status(400).json({
                message: "superAdminは必ず団体に所属する必要があります",
              });
            }
            organizationId = superAdmin.organizations[0].organization.id;

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
          // 토큰 오류 무시
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
        gender: gender as Gender, // 타입 단언
        role: role as Role, // 타입 단언
        photoPath,
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
    console.error("폼 파싱 또는 처리 오류:", error);
    res.status(500).json({ message: "先生追加にエラーが発生しました" });
  }
}
