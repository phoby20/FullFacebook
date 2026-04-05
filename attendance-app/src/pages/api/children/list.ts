// pages/api/children/list.ts
import { PrismaClient } from "@prisma/client";
import { getTokenUser } from "../../../../utils/auth";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function GET(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const user = await getTokenUser(request);
  if (!user || user.role === "child") {
    response.status(403).json({ message: "権限がありません。" });
  }

  try {
    const children = await prisma.child.findMany({
      where: { isGraduated: false },
      select: {
        id: true,
        name: true,
        birthDay: true,
        grade: true,
        photoPath: true,
        assignedAdmins: { select: { adminId: true } },
      },
    });
    response.status(200).json(
      children.map((c) => ({
        ...c,
        assignedAdminIds: c.assignedAdmins.map((a) => a.adminId),
        assignedAdmins: undefined,
      }))
    );
  } catch {
    response.status(500).json({ message: "学生の取得に失敗しました。" });
  }
}
