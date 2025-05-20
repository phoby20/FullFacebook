import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getTokenUser } from "../../../../../utils/auth";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getTokenUser(req);
  if (!user || user.role === "child") {
    return res.status(403).json({ message: "権限がありません。" });
  }

  if (req.method === "PUT") {
    const { name } = req.body;
    const { id } = req.query;

    if (!name) {
      return res.status(400).json({ message: "当番名が必要です。" });
    }
    try {
      const duty = await prisma.duty.update({
        where: { id: id as string },
        data: { name },
      });
      return res.status(200).json({ message: "当番名が更新されました", duty });
    } catch (error) {
      console.error("PUT error:", error);
      return res
        .status(500)
        .json({ message: "当番名の更新に失敗しました。", error });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    try {
      const duty = await prisma.duty.delete({
        where: { id: id as string },
      });
      return res.status(200).json({ message: "当番名を削除しました。", duty });
    } catch (error) {
      console.error("DELETE error:", error);
      return res
        .status(500)
        .json({ message: "当番名の削除に失敗しました。", error });
    }
  }
}
