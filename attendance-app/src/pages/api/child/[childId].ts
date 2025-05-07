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
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { childId } = req.query; // 동적 경로에서 추출
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const child = await prisma.child.findUnique({
      where: { id: childId as string },
      select: {
        id: true,
        name: true,
        birthDay: true,
        photoPath: true,
        phone: true,
        gender: true,
        lineId: true,
        cacaoTalkId: true,
        assignedAdminId: true,
      },
    });

    if (!child) return res.status(404).json({ message: "Child not found" });
    if (
      decoded.role !== "superAdmin" &&
      child.assignedAdminId !== decoded.userId
    ) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    // birthDay를 ISO 문자열로 변환
    return res.status(200).json({
      ...child,
      birthDay: child.birthDay.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching child:", error);
    return res.status(500).json({ message: "Failed to fetch child" });
  }
}
