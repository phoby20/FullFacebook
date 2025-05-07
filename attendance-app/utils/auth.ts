import { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

type TokenPayload = {
  userId: string;
  role: "superAdmin" | "admin";
  email: string;
};

export async function getTokenUser(
  req: NextApiRequest
): Promise<TokenPayload | null> {
  const token = req.cookies?.token;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}
