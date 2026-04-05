import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    const { userId, isActive } = req.body as {
      userId: string;
      isActive: boolean;
    };

    if (!userId || typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive,
          deactivatedAt: isActive ? null : new Date(),
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user active state:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["admin"] } },
      select: {
        id: true,
        name: true,
        photoPath: true,
        birthDay: true,
        isActive: true,
        assignedChildren: {
          where: { child: { isGraduated: false } },
          select: {
            child: {
              select: {
                id: true,
                name: true,
                photoPath: true,
                birthDay: true,
                grade: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json(
      admins.map((admin) => ({
        ...admin,
        assignedChildren: admin.assignedChildren.map((a) => a.child),
      }))
    );
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({ message: "Failed to fetch admins" });
  }
}
