// ✅ 2. 로그인 기능 (pages/api/auth/login.ts)

import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";
import { serialize } from "cookie";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, newPassword, token, action } = req.body;

  // 📧 Request password reset email
  if (action === "requestReset") {
    if (!email) {
      return res.status(400).json({ message: "Emailが必要です" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiresAt: expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: "noreply@yourdomain.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password.</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 1 hour.</p>`,
    });

    return res
      .status(200)
      .json({ message: "パスワードリセットメールを送信しました" });
  }

  // 🔑 Password reset using token
  if (action === "resetPassword") {
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Tokenと新しいパスワードが必要です" });
    }

    const stored = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "無効または期限切れのトークンです" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);

    await prisma.user.update({
      where: { email: stored.email },
      data: { password: hashed },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return res.status(200).json({ message: "パスワードが更新されました" });
  }

  const loginPassword = password;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(loginPassword, user.password)) {
    return res
      .status(401)
      .json({ message: "ログイン情報を再度確認してください" });
  }

  const tokenJwt = jwt.sign(
    { userId: user.id, role: user.role, userName: user.name },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    },
  );

  // 응답에 쿠키 설정
  res.setHeader(
    "Set-Cookie",
    serialize("token", tokenJwt, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }),
  );

  res.status(200).json({ token: tokenJwt });
}
