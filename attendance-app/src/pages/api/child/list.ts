import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const children = await prisma.child.findMany({
    orderBy: { name: "asc" },
  });

  res.status(200).json(children);
}
