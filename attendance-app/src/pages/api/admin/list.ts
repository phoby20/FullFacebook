import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["admin"] }, isActive: true },
      select: {
        id: true,
        name: true,
        photoPath: true,
        birthDay: true,
        isActive: true,
        assignedChildren: {
          where: { isGraduated: false },
          select: {
            id: true,
            name: true,
            photoPath: true,
            birthDay: true,
            grade: true,
          },
        },
      },
    });
    return res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({ message: "Failed to fetch admins" });
  }
}
