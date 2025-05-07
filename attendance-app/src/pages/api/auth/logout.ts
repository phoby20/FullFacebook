import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 쿠키를 무효화
  res.setHeader("Set-Cookie", "token=; Path=/; HttpOnly; Max-Age=0");
  res.status(200).json({ message: "Logged out" });
}
