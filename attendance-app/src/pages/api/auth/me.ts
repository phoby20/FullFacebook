// src/pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getTokenUser } from "../../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getTokenUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  res.status(200).json({ user });
}
