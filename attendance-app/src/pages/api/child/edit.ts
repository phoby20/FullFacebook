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
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    childId,
    name,
    birthDay,
    photoPath,
    gender,
    phone,
    lineId,
    cacaoTalkId,
  } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  if (!childId || !name || !birthDay || !gender) {
    return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
  }

  const calcGrade = (birthDayStr: string): number => {
    const birth = new Date(birthDayStr);
    const birthYear = birth.getFullYear();
    const birthMonth = birth.getMonth() + 1;
    const birthDate = birth.getDate();

    const elementaryEntryYear =
      birthMonth > 4 || (birthMonth === 4 && birthDate >= 2)
        ? birthYear + 7
        : birthYear + 6;

    const now = new Date();
    const currentSchoolYear =
      now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;

    const yearsElapsed = currentSchoolYear - elementaryEntryYear;

    const gradeMap: Record<number, number> = {
      6: 1, 7: 2, 8: 3, 9: 4, 10: 5, 11: 6,
    };
    return gradeMap[yearsElapsed] ?? 1;
  };

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { assignedAdmins: { select: { adminId: true } } },
    });

    if (!child) return res.status(404).json({ message: "Child not found" });
    if (
      decoded.role !== "superAdmin" &&
      !child.assignedAdmins.some((a) => a.adminId === decoded.userId)
    ) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        name,
        birthDay: new Date(birthDay),
        grade: calcGrade(birthDay),
        photoPath,
        gender,
        phone: phone || null,
        lineId: lineId || null,
        cacaoTalkId: cacaoTalkId || null,
      },
    });

    return res.status(200).json({
      message: "Child updated",
      child: {
        ...updatedChild,
        birthDay: updatedChild.birthDay.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating child:", error);
    return res.status(500).json({ message: "Failed to update child" });
  }
}
