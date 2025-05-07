// ✅ 2. 로그인 기능 (pages/api/auth/login.ts)

import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";
import { serialize } from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, userName: user.name },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  // 응답에 쿠키 설정
  res.setHeader(
    "Set-Cookie",
    serialize("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );

  res.status(200).json({ token });
}
