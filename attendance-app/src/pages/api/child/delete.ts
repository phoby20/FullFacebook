import { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import { prisma } from "../../../../lib/prisma";

type DecodedToken = {
  userId: string;
  role: "superAdmin" | "admin" | "child";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { childId } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  if (!childId)
    return res.status(400).json({ message: "Child ID is required" });

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { assignedAdminId: true },
    });

    if (!child) return res.status(404).json({ message: "Child not found" });
    if (
      decoded.role !== "superAdmin" &&
      child.assignedAdminId !== decoded.userId
    ) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    await prisma.child.delete({
      where: { id: childId },
    });

    return res.status(200).json({ message: "Child deleted" });
  } catch (error) {
    console.error("Error deleting child:", error);
    return res.status(500).json({ message: "Failed to delete child" });
  }
}
